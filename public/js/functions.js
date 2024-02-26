// functions

const { Drone } = require("./classes");
const statusDelivering = "Delivering";
const statusDelivered = "Delivered";
const statusRejected = "Rejected";
let drones = [];
let sleepingDrones = [];
let droneId = 0;
// The day is long 12 hours
let fullDayTime = 12 * 60;
let days = 0;

function createInitialDrones(warehouses, droneType) {
  // Assume each house have equal number of drones
  let dronesPerWarehouse = 1;
  warehouses.forEach((warehouse) => {
    for (let i = 0; i < dronesPerWarehouse; i++) {
      let newDrone = new Drone(++droneId, warehouse.name, droneType);
      drones.push(newDrone);
      warehouse.totalAliveDrones.push(newDrone);
    }
  });
}
// Check if a customer is whithin the map range
function withinTheMap(customer, mapRange) {
  let topRight =
    mapRange.mapTopRightCoordinate.x >= customer.coordinates.x &&
    mapRange.mapTopRightCoordinate.y >= customer.coordinates.y;
  let bottomLeft = 0 <= customer.coordinates.x && 0 <= customer.coordinates.y;

  if (topRight && bottomLeft) {
    return true;
  } else {
    return false;
  }
}

// Distance between Warehouse and Customer
function distance(warehouse, customer) {
  return Math.sqrt(
    (warehouse.x - customer.coordinates.x) ** 2 +
      (warehouse.y - customer.coordinates.y) ** 2
  );
}

function calculateDeliveryTime(smallestDistance) {
  // Movement speed is constant and equal to a single unit in the map for a minute
  // For example, the drone travels the distance from point (0,0) to the point (0, 1) for one minute
  let waitingTime = 0;
  let speedTime = smallestDistance;
  // Unpredictable mistakes on the route
  let mistakesTime = (0.5 / 100) * smallestDistance;
  return waitingTime + speedTime + mistakesTime;
}

function calculateReturnTime(deliveryTime) {
  return deliveryTime;
}

// Assigning Customer to Warehouse
function assignCustomerToWarehouse(orders, customers, warehouses, mapRange) {
  // Initiallizing order to specific location by customer
  orders.forEach((order) => {
    const customer = customers.find(
      (customer) => customer.id == order.customerId
    );

    // Check if the order is within the map
    if (withinTheMap(customer, mapRange)) {
      let closestWarehouse = null;
      let smallestDistance = Number.MAX_VALUE;

      // Selects the warehouse for this order
      warehouses.forEach((warehouse) => {
        const currDistance = distance(warehouse, customer);
        if (currDistance <= smallestDistance) {
          smallestDistance = currDistance;
          closestWarehouse = warehouse;
        }
      });

      let deliveryTime = calculateDeliveryTime(smallestDistance);
      let returnTime = calculateReturnTime(deliveryTime);

      customer.assignWarehouse(
        closestWarehouse,
        deliveryTime,
        returnTime,
        smallestDistance
      );
      order.assignWarehouse(
        closestWarehouse,
        deliveryTime,
        returnTime,
        smallestDistance
      );
      closestWarehouse.incrementNumberOfOrders();
    }
  });
}

function assignChargingStationToCustomer(chargingStations, customers) {
  customers.forEach((customer) => {
    let minDistance = Number.MAX_VALUE;
    let closestChargingStation = null;

    chargingStations.forEach((chargingStation) => {
      const currDistance = distance(chargingStation, customer);
      if (currDistance <= minDistance) {
        minDistance = currDistance;
        closestChargingStation = chargingStation;
      }
    });

    customer.assignChargingStation(closestChargingStation);
  });
}

// Calculate total weight of an order in kg
function calculateTotalLoad(order, products) {
  let totalLoad = 0;
  order.productList.forEach((orderedProduct) => {
    let productWeight = products.find(
      (product) => product.productType === orderedProduct.product
    );
    if (productWeight === undefined) {
      console.log("Product not found: ", orderedProduct.product);
      order.orderStatus =
        statusRejected + ": Product not found: " + orderedProduct.product;
      return;
    }
    totalLoad += productWeight.productWeight * orderedProduct.quantity;
    if (totalLoad === 0) {
      console.log("Nothing to deliver! Total weight: ", totalLoad);
      order.orderStatus = statusRejected + ": Nothing to deliver";
      return;
    }
  });
  let num = Number((totalLoad / 1000).toFixed(0));
  if (num === 0 && totalLoad > 0) {
    num = 1;
  }
  // From grams to kilograms
  return num;
}

// Calculates the total consumption of a drone per minute
function calculateTotalConsumption(order, products) {
  let powerConsumptionPerLoadPerMinute = Number(
    calculateTotalLoad(order, products)
  );
  let basePowerConsumption = order.drone.type.consumption;

  return Number(powerConsumptionPerLoadPerMinute + basePowerConsumption);
}

async function loopWarehousesToAssignOrders(
  orders,
  customers,
  warehouses,
  droneTypes,
  products,
  realToProgramRatio
) {
  const warehousePromises = [];

  for (const warehouse of warehouses) {
    let currentOrders = orders.filter(
      (order) => order.warehouse.name === warehouse.name
    );
    const warehousePromise = assignDroneToOrder(
      currentOrders,
      warehouse,
      customers,
      droneTypes,
      products,
      realToProgramRatio
    );

    warehousePromises.push(warehousePromise);
  }

  // Wait for all groups to be processed
  await Promise.all(warehousePromises);
}

async function assignDroneToOrder(
  currentOrders,
  warehouse,
  customers,
  droneTypes,
  products,
  realToProgramRatio
) {
  // Makes ordersInput always an array
  currentOrders = Array.isArray(currentOrders)
    ? currentOrders
    : [currentOrders];

  let droneWithMinFinishtime = null;

  const deliveryPromises = [];

  for (const order of currentOrders) {
    // Assign the power consumption for this order load
    let powerConsumptionPerLoadPerMinute = Number(
      calculateTotalLoad(order, products)
    );
    if (powerConsumptionPerLoadPerMinute === 0) {
      continue;
    }
    const customer = customers.find(
      (customer) => customer.id === order.customerId
    );
    // Array with all the drones in the customer warehouse
    const currWarehouseDrones = drones.filter(
      (drone) => drone.warehouseMother === customer.warehouse.name
    );
    // Array with all the drones with the battery needed
    let currDronesWithBattery = currWarehouseDrones.filter(
      (drone) =>
        drone.batteryStatus >
        (customer.deliveryTime + customer.returnTime) *
          (drone.type.consumption + powerConsumptionPerLoadPerMinute)
    );
    // In case drones with needed battery were not found
    if (currDronesWithBattery.length === 0) {
      // Checks if we add one more to the number of drones in warehouse they would be higher than 60% of orders
      // if it is true, we cannot create new drones
      // we should re-charge our current
      let maxWarehouseDrones = Number((20 / 100) * currentOrders.length);

      // Check If the drone has enough capacity, even if re-charged fully, to deliver the order
      let notSleepingDronesWithBatteryCapacity =
        customer.warehouse.totalAliveDrones.filter(
          (drone) =>
            drone.type.capacity >
            customer.deliveryTime *
              (drone.type.consumption + powerConsumptionPerLoadPerMinute)
        );
      if (
        customer.warehouse.totalAliveDrones.length + 1 >= maxWarehouseDrones &&
        notSleepingDronesWithBatteryCapacity.length > 0
      ) {
        let droneToBeCharged = notSleepingDronesWithBatteryCapacity.reduce(
          (prev, curr) => (prev.finishTime < curr.finishTime ? prev : curr)
        );

        while (true) {
          let returnedDrone = drones.filter(
            (drone) =>
              drone.warehouseMother === warehouse.name &&
              drone.droneId === droneToBeCharged.droneId
          );
          if (returnedDrone.length !== 0) {
            break;
          } else {
            await sleep(realToProgramRatio * 1);
          }
        }

        // Removing the drone from the array while charging
        await chargeDrone(
          droneToBeCharged,
          15,
          false,
          drones,
          realToProgramRatio
        );
        droneWithMinFinishtime = droneToBeCharged;
      } else {
        // If we are able to buy new drones
        let suitableDroneTypes = droneTypes.filter(
          (droneType) =>
            droneType.capacity >
            (customer.deliveryTime + customer.returnTime) *
              (droneType.consumption + powerConsumptionPerLoadPerMinute)
        );
        // In case drone types with needed battery for round trip were not found
        if (suitableDroneTypes.length === 0) {
          // Check if there's a droneType that will be able to make a one-way trip
          suitableDroneTypes = droneTypes.filter(
            (droneType) =>
              droneType.capacity >
              customer.deliveryTime *
                (droneType.consumption + powerConsumptionPerLoadPerMinute)
          );
          if (suitableDroneTypes.length === 0) {
            console.log(
              "No drone type that can deliver order with such parameters"
            );
            order.orderStatus = statusRejected + ": Order is too heavy!";
            continue;
          }
        }
        let chosenDroneType = suitableDroneTypes.reduce((prev, curr) =>
          prev.capacity > curr.capacity ? prev : curr
        );
        let newDrone = new Drone(
          ++droneId,
          customer.warehouse.name,
          chosenDroneType
        );
        drones.push(newDrone);
        currDronesWithBattery.push(newDrone);

        // Drone with the minimum finish time for the customer warehouse
        droneWithMinFinishtime = currDronesWithBattery.reduce((prev, curr) =>
          prev.finishTime < curr.finishTime ? prev : curr
        );
      }
    } else {
      // Drone with the minimum finish time for the customer warehouse
      droneWithMinFinishtime = currDronesWithBattery.reduce((prev, curr) =>
        prev.finishTime < curr.finishTime ? prev : curr
      );
    }

    order.assignDrone(
      droneWithMinFinishtime,
      customer.warehouse,
      customer.distance,
      customer.deliveryTime,
      customer.returnTime
    );
    order.assignTotalPowerConsumption(
      calculateTotalConsumption(order, products)
    );

    // Remove the drone that is about to deliver from the array
    drones = drones.filter((drone) => drone.droneId !== order.drone.droneId);

    const deliveryPromise = deliverOrder(
      order,
      customer.deliveryTime,
      customer.returnTime,
      realToProgramRatio
    );

    deliveryPromises.push(deliveryPromise);
  }

  await Promise.all(deliveryPromises);
}

/**
 Function that should be executed asynchronously and should add 
 the drone back to the drones array when the drone is returned to the warehouse.
*/
async function deliverOrder(
  order,
  deliveryTime,
  returnTime,
  realToProgramRatio
) {
  if (order.drone.finishTime >= fullDayTime) {
    console.log("The working day is over, bye bye!");
    days++;
    drones.forEach((drone) => {
      drone.resetDrone();
    });
    await sleep(realToProgramRatio * (24 * 60 - order.drone.finishTime));
    console.log("Hello! Ready to work!");
  }

  // Charge for 5 minutes while waiting for the packet to be wrapped
  await chargeDrone(order.drone, 5, true, realToProgramRatio);
  console.log("Delivering to: ", order.customerId);
  order.orderStatus = statusDelivering;
  console.log(
    "Total power consumption for this order: ",
    order.totalPowerConsumption
  );

  order.drone.printStatus();

  // Deduct battery for the full delivery (round-trip)
  order.drone.batteryStatus -=
    (deliveryTime + returnTime) * order.totalPowerConsumption;

  // If the drone started the order with battery capacity, only suitable for the deliveryTime
  // meaning now it has negative battery status
  // it should not be pushed back
  if (order.drone.batteryStatus < 0) {
    sleepingDrones.push(order.drone);
    // Remove the dead drone from the totalAliveDrones array
    order.warehouse.totalAliveDrones = order.warehouse.totalAliveDrones.filter(
      (dr) => dr.droneId !== order.drone.droneId
    );
  }

  order.drone.finishedOrder(deliveryTime + returnTime);
  order.assignFinishTime(order.drone.finishTime);
  await sleep(realToProgramRatio * (deliveryTime + returnTime));

  // Put the dron back in the array after it has returned to the warehouse and has some battery
  if (order.drone.batteryStatus >= 0) {
    drones.push(order.drone);
  }
  console.log("Delivered to: ", order.customerId);
  order.orderStatus = statusDelivered;
  console.log(
    "Battery consumption for delivery: ",
    (deliveryTime + returnTime) * order.totalPowerConsumption
  );
  order.drone.printStatus();
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function chargeDrone(
  drone,
  time,
  isWaitingForPacket,
  realToProgramRatio
) {
  drones = drones.filter((dr) => dr.droneId !== drone.droneId);

  // Takes 20 minutes for every drone to be charged to 100%
  let timeToFullCharge = 20;

  let batteryLeftInMinutes = drone.type.worktime - drone.batteryStatus;

  // Get the minimum time needed to charge to 100%
  // If the time to charge is too high.
  time = Math.min(
    batteryLeftInMinutes * (timeToFullCharge / drone.type.capacity),
    time
  );

  console.log("Status before charging: ");
  drone.printStatus();

  drone.batteryStatus += (time / timeToFullCharge) * drone.type.worktime;

  // It should sleep for 5 minutes anyways because
  // That's how much we wait for the packet to be wrapped.
  if (isWaitingForPacket) {
    console.log("Waiting for packet...");
    time = 5;
  }

  // Sleep for the equivalent
  await sleep(realToProgramRatio * time);

  // Add the time for charging to the drone's finish time
  drone.finishTime += time;

  console.log("Status after charging: ");
  drone.printStatus();

  if (!isWaitingForPacket) {
    drones.push(drone);
  }
}

// The time that the last order is delivered
function calculateMaxDeliveryTime(orders) {
  let maxTime = Number.MIN_VALUE;
  orders.forEach((order) => {
    let res = order.finishTime - order.returnTime;
    if (res > maxTime) {
      maxTime = res;
    }
  });
  return maxTime;
}

// The drones used for all the orders
function calculateDronesUsed(orders) {
  const res = new Set();
  orders.forEach((order) => {
    res.add(order.drone.droneId);
  });
  return res.size;
}

// The drones used for a warehouse
function calculateDronesInWarehouse(warehouse) {
  let count = 0;
  drones.forEach((drone) => {
    if (drone.warehouseMother == warehouse) {
      count++;
    }
  });
  sleepingDrones.forEach((drone) => {
    if (drone.warehouseMother == warehouse) {
      count++;
    }
  });

  return count;
}

// The average time order needs to be delivered
function averageDeliveryTime(orders) {
  let sumDeliveryTime = 0;
  orders.forEach((order) => {
    sumDeliveryTime += 5 + order.deliveryTime;
  });
  let averageDeliveryTime = sumDeliveryTime / orders.length;

  return averageDeliveryTime;
}

// Output that contains:
function output(orders, warehouses) {
  const MaxDeliveryTime = calculateMaxDeliveryTime(orders);
  console.log(
    "Total delivery time:",
    Number(days * 24 * 60 + MaxDeliveryTime).toFixed(2),
    "minutes"
  );
  console.log(
    "Average delivery time:",
    Number(averageDeliveryTime(orders)).toFixed(2),
    "minutes"
  );
  console.log("Number of drones used:", calculateDronesUsed(orders));
  // Drones that went out of battery during delivery
  console.log("Dead drones: ", sleepingDrones.length);
  warehouses.forEach((warehouse) => {
    let dronesInWarehouse = calculateDronesInWarehouse(warehouse.name);
    console.log("Drones in " + warehouse.name + ": " + dronesInWarehouse);
  });
}

// Needed to use the functions in server.js
module.exports = {
  createInitialDrones,
  withinTheMap,
  distance,
  calculateDeliveryTime,
  calculateReturnTime,
  assignCustomerToWarehouse,
  assignChargingStationToCustomer,
  calculateTotalLoad,
  calculateTotalConsumption,
  loopWarehousesToAssignOrders,
  assignDroneToOrder,
  deliverOrder,
  sleep,
  chargeDrone,
  calculateMaxDeliveryTime,
  calculateDronesUsed,
  calculateDronesInWarehouse,
  averageDeliveryTime,
  output,
};

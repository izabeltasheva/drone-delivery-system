//classes
class Warehouse {
  constructor(x, y, name) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.countOfOrders = 0;
    // Holds the number of drones for this warehouse.
    // If a drone dies, it will be deducted from this number.
    this.totalAliveDrones = [];
  }

  incrementNumberOfOrders() {
    this.countOfOrders += 1;
  }
}

class Customer {
  constructor(id, name, x, y) {
    this.id = id;
    this.name = name;
    this.coordinates = { x, y };
  }

  //assign warehouse to customer
  assignWarehouse(warehouse, deliveryTime, returnTime, distance) {
    this.warehouse = warehouse;
    this.deliveryTime = deliveryTime;
    this.returnTime = returnTime;
    this.distance = distance;
  }

  assignChargingStation(closestChargingStation) {
    this.closestChargingStation = closestChargingStation;
  }
}

class Order {
  static lastId = 0; // Static property to keep track of the last used ID

  constructor(customerId, productList, orderStatus) {
    this.id = ++Order.lastId; // Increment the static property for each new instance
    // TODO: Change to Customer
    this.customerId = customerId;
    this.productList = productList;
    this.orderStatus = orderStatus;
  }

  //assign warehouse to customer
  assignWarehouse(warehouse, deliveryTime, returnTime, distance) {
    this.warehouse = warehouse;
    this.deliveryTime = deliveryTime;
    this.returnTime = returnTime;
    this.distance = distance;
  }

  //assign drone to order
  assignDrone(drone, warehouse, distance, deliveryTime, returnTime) {
    if (this.warehouse === undefined) {
      this.warehouse = warehouse;
    }
    this.drone = drone;
    this.distance = distance;
    this.deliveryTime = deliveryTime;
    this.returnTime = returnTime;
  }

  assignTotalPowerConsumption(totalPowerConsumption) {
    this.totalPowerConsumption = totalPowerConsumption;
  }

  //order delivered
  assignFinishTime(finishTime) {
    this.finishTime = finishTime;
  }
}

class Drone {
  constructor(droneId, warehouseMother, droneType) {
    this.droneId = droneId;
    this.warehouseMother = warehouseMother;
    this.ordersMade = 0;
    this.finishTime = 0;
    this.type = droneType;
    this.batteryStatus = droneType.worktime;
  }

  //assign order to drone
  finishedOrder(time) {
    this.ordersMade += 1;
    this.finishTime += time;
  }

  //reset drone for the next day
  resetDrone() {
    this.batteryStatus = this.type.worktime;
  }

  // Print drone status
  printStatus() {
    console.log(
      `\nDrone ID: ${this.droneId}, Warehouse: ${this.warehouseMother}, Orders Made: ${this.ordersMade}, Finish Time: ${this.finishTime}, Battery Status: ${this.batteryStatus}/${this.type.worktime}\n`
    );
  }
}

class DroneType {
  constructor(capacity, consumption, chargingType) {
    this.capacity = capacity;
    this.consumption = consumption;
    this.worktime = capacity / consumption;
    this.chargingType = chargingType;
  }
}

class ChargingStation {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
  }
}

// Needed to use the classes in different .js
module.exports = {
  Warehouse,
  Customer,
  Order,
  Drone,
  DroneType,
  ChargingStation,
};

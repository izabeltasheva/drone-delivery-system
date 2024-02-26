// main.js
const fs = require("fs");
const { startServer } = require("./server"); // Import the server start function
const { Warehouse, Customer, Order, DroneType, ChargingStation } = require("./public/js/classes");
const { createInitialDrones, assignCustomerToWarehouse, assignChargingStationToCustomer, loopWarehousesToAssignOrders, output } = require("./public/js/functions");

// Load initial data from JSON file
const data = JSON.parse(fs.readFileSync("input.json", "utf8"));
const mapRange = { mapTopRightCoordinate: data["map-top-right-coordinate"] };
const warehouses = data.warehouses.map(warehouse => new Warehouse(warehouse.x, warehouse.y, warehouse.name));
const customers = data.customers.map(customer => new Customer(customer.id, customer.name, customer.coordinates.x, customer.coordinates.y));
const orders = data.orders.map((order) => {
    // Convert productList from an object to an array of objects with key-value pairs
    const productListArray = Object.entries(order.productList).map(
        ([product, quantity]) => {
            return { product, quantity };
        }
    );

    return new Order(order.customerId, productListArray);
});
// Check if there are any orders
if (!orders.length) {
    console.log("There are no orders made.");
    return;
}

const products = Object.entries(data.products).map(([key, value]) => {
    return { productType: key, productWeight: value };
});
const transformedDroneTypes = data.typesOfDrones.map((tod) => {
    // Remove unit suffixes and convert to numbers
    let capacity = parseInt(tod.capacity.replace(/\D+/g, ""));

    // Apply necessary unit conversion factors for kW only
    if (tod.capacity.endsWith("kW")) {
        capacity *= 1000;
    }

    const consumption = parseInt(tod.consumption.replace(/\D+/g, ""));

    return { capacity, consumption };
});
const droneTypes = transformedDroneTypes.map(tod => new DroneType(tod.capacity, tod.consumption, tod.type));
const chargingStations = data.chargingStations.map(cs => new ChargingStation(cs.x, cs.y, cs.type));
// Calculate the desired ratio and store it in a constant
const realToProgramRatio = data.output.minutes.real / data.output.minutes.program;
const deliveryStatus = data.deliveryStatus;

createInitialDrones(warehouses, droneTypes[0]);

async function main() {
    try {
        assignCustomerToWarehouse(orders, customers, warehouses, mapRange); // Assuming this does not need to be awaited
        assignChargingStationToCustomer(chargingStations, customers); // Assuming this does not need to be awaited
        await loopWarehousesToAssignOrders(
            orders,
            customers,
            warehouses,
            droneTypes,
            products,
            realToProgramRatio
        );
        output(orders, warehouses); // Assuming output doesn't need to be awaited or is not async
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
    }
}

main();

if (data.output.poweredOn) {
    startServer(orders, products, customers, warehouses, droneTypes, realToProgramRatio, deliveryStatus);
}
Name: Izabel Tasheva
Email: izabel.tasheva21@gmail.com
LinkedIn: https://www.linkedin.com/in/izabel-tasheva-3bb5352b0/


### Task definition: [readme](./.docs/task-definition.md)

# Drone Delivery System

This project implements a drone delivery system simulation, managing orders, customers, warehouses, drones, and charging stations. It includes a server handling real-time order processing and assignment of drones to deliver orders within a simulated environment. The system also accounts for drone battery levels, warehouse order processing, and customer assignments to their nearest warehouses.

## Assumptions made by the author

- Active drones per warehouse cannot exceed 20% of the orders.
- Each warehouse starts with 1 drone of type 1, because it's the most efficient type.
- Customers outside of the map region area will not be served.
- Each customer is assigned to the closest warehouse.
- I've allowed a 0.5% mistake on the delivery time in case of bad weather, technical problems and etc.
- Drones go on a delivery only if the full battery capacity is enough to reach the customer.
- Each drone has a warehouse mother, and only returns there.
- The drone will use the time while the order is being packed, to recharge its battery for the time being (5 minutes).
- Users will not enter orders by editing the `input.json`, but they'll rather use the frontend form.
- The user cannot add new customers different from the ones in the initial `input.json`. (This will return an error)
- The user cannot add an order with a product that is not present in the initial `input.json`. (This will return an order with Rejected status)
- If the order is too heavy to be delivered, it will be rejected. (This will return an order with Rejected status)
- The user cannot add an order with products with a total of 0 quantity. (This will return an order with Rejected status)

## Features

- Real-time order processing with Socket.IO.
- Simulation of drone deliveries considering battery consumption and delivery times.
- Dynamic assignment of customers to warehouses based on proximity.
- Visualization of order statuses in real-time.

## Getting Started

### Prerequisites

- Node.js (v12.x or later recommended)
- npm (v6.x or later)

### Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:izabeltasheva/drone-delivery-system.git
   ```

2. Install NPM packages:

   ```bash
   cd drone-delivery-system
   npm install
   ```

3. Start the server:
   ```bash
   node main.js
   ```

## Usage

After starting the server, connect to `http://localhost:3000` to access the drone delivery order and status dashboard. Use the toggle switch to start/stop the order processing simulation.

Orders can be submitted through the system's UI (using the order form) or directly via Postman: `ws://localhost:3000`.

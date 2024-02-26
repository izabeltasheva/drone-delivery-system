// server.js
const path = require("path");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { Order } = require("./public/js/classes");
const { assignDroneToOrder } = require("./public/js/functions");
const statusPending = "Pending";
const statusDelivering = "Delivering";

// Function to create and start the server
function startServer(
  orders,
  products,
  customers,
  warehouses,
  droneTypes,
  realToProgramRatio,
  deliveryStatus
) {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);

  // Serve static files from the 'public' directory
  app.use(express.static("public"));

  // Send index.html when the user accesses the web root
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  // Set up the server to listen on port 3000
  // TODO: add and .env file for the configuration
  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Send initial toggle switch status to client
    socket.emit("initialToggleStatus", { isEnabled: deliveryStatus.output });

    let sendOrdersInterval; // Variable to hold the interval ID

    // Handle request to start sending orders
    socket.on("startSendingOrders", () => {
      if (sendOrdersInterval) {
        // If orders are already being sent, clear the interval to avoid duplicates
        clearInterval(sendOrdersInterval);
      }
      // Start sending orders every 40 milliseconds
      sendOrdersInterval = setInterval(() => {
        // Assuming you have a function or logic to fetch or generate orders
        // For demonstration, using a static `orders` array
        socket.emit("allOrders", orders);
        // console.log("Sent all orders to:", socket.id);
      }, deliveryStatus.frequency * realToProgramRatio); // Adjust the interval as needed
    });

    // Handle request to stop sending orders
    socket.on("stopSendingOrders", () => {
      if (sendOrdersInterval) {
        clearInterval(sendOrdersInterval);
        sendOrdersInterval = null; // Clear the interval ID
        // console.log("Stopped sending orders to:", socket.id);
      }
    });

    // Handle client disconnect
    socket.on("disconnect", () => {
      if (sendOrdersInterval) {
        // Clean up on disconnect to avoid memory leaks
        clearInterval(sendOrdersInterval);
        console.log("User disconnected, stopped sending orders to:", socket.id);
      }
    });

    // Receiving a new order
    socket.on("newOrder", async (orderData) => {
      console.log("Received order:", orderData);

      // Parse the received order data and create a new Order instance
      const newOrder = new Order(
        orderData.customerId,
        orderData.productList,
        statusPending
      );

      // Find the customer details based on customerId
      const customer = customers.find((c) => c.id === newOrder.customerId);
      if (!customer) {
        console.error("Customer not found for the new order");
        // Respond back with an error status
        socket.emit("orderStatus", {
          orderId: newOrder.id,
          status: "Error: Customer not found",
        });
        return;
      }
      orders.push(newOrder);

      socket.emit("orderStatus", {
        orderId: newOrder.id,
        status: statusDelivering,
      });

      await assignDroneToOrder(
        [newOrder],
        customer.warehouse,
        customers,
        droneTypes,
        products,
        realToProgramRatio
      );

      socket.emit("orderStatus", {
        orderId: newOrder.id,
        status: newOrder.orderStatus,
      });
    });
  });
}

// Export the function so it can be called from main.js
module.exports = { startServer };

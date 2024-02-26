document.addEventListener("DOMContentLoaded", function () {
  const socket = io.connect("http://localhost:3000", {
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
  });
  const orderForm = document.getElementById("orderForm");
  const customerIdInput = document.getElementById("customerId");
  const productsInput = document.getElementById("products");
  const statusBox = document.getElementById("statusBox");
  const connectionStatus = document.getElementById("connectionStatus");
  const ordersList = document.getElementById("ordersList");

  const toggleSwitch = document.getElementById("toggleSwitch");

  socket.on("initialToggleStatus", (data) => {
    toggleSwitch.checked = data.isEnabled;

    // Based on the deliveryStatus.poweredOn field in the configuration (input.json)
    const event = new Event('change');
    toggleSwitch.dispatchEvent(event);
  });

  toggleSwitch.addEventListener("change", () => {
    if (toggleSwitch.checked) {
      // If the toggle is switched on, request the server to start sending orders
      socket.emit("startSendingOrders");
    } else {
      // If the toggle is switched off, request the server to stop sending orders
      socket.emit("stopSendingOrders");
      // clear the current list of orders displayed
      ordersList.innerHTML = "";
    }
  });

  socket.on("allOrders", (orders) => {
    if (toggleSwitch.checked) {
      console.log("Received orders", orders);
      ordersList.innerHTML = "<h3>Order Details</h3>";

      orders.forEach((order, index) => {
        // Use a table for clarity
        const orderDetails = `
          <div class="order-detail">
            <strong>Order ID:</strong> ${index + 1}<br>
            <strong>Customer ID:</strong> ${order.customerId}<br>
            <strong>Products:</strong> ${formatProductList(order.productList)}<br>
            <strong>Delivery Time:</strong> ${Number(order.deliveryTime).toFixed() + " min" || "Pending"}<br>
            <strong>Status:</strong> ${order.orderStatus}<br>
          </div>
        `;
        ordersList.innerHTML += orderDetails;
      });
    }
  });

  function formatProductList(productList) {
    return productList.map(p => `${p.product}: ${p.quantity}`).join(", ");
  }

  socket.on("connect", () => {
    connectionStatus.textContent = "Connected to server";
    connectionStatus.classList.add("connected");
  });

  socket.on("disconnect", () => {
    connectionStatus.textContent = "Disconnected from server";
    connectionStatus.classList.remove("connected");
  });

  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!orderForm.checkValidity()) {
      orderForm.reportValidity();
      return;
    }

    // Cleanup order status box:
    statusBox.innerHTML = "Order Status: Pending";
    statusBox.style.display = "block";
    statusBox.setAttribute("aria-live", "polite"); // Accessibility for dynamic content

    const customerId = parseInt(customerIdInput.value, 10);
    const productsArray = productsInput.value
      .split(",")
      .map((productString) => {
        const [name, quantityString] = productString.split(":");
        return {
          product: name.trim(),
          quantity: parseInt(quantityString, 10),
        };
      });

    const productList = productsArray;

    // const productList = products.reduce((acc, product) => {
    //     acc[product.name] = product.quantity;
    //     return acc;
    // }, {});

    socket.emit("newOrder", {
      customerId: customerId,
      productList: productList,
    });
  });

  socket.on("orderStatus", function (status) {
    statusBox.innerHTML = "Order Status: " + status.status;
    statusBox.style.display = "block";
    statusBox.setAttribute("aria-live", "polite"); // Accessibility for dynamic content
  });

  document.addEventListener("click", function (e) {
    if (e.target && e.target.className.includes("dropdown")) {
      const content = e.target.nextElementSibling;
      content.style.display =
        content.style.display === "block" ? "none" : "block";
    }
  });
});

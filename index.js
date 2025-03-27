document.addEventListener("DOMContentLoaded", async () => {
  const orderlist = document.getElementById("ordersList");
  const orderForm = document.getElementById("orderForm");

  const priceList = {
    Pizza: 10.99,
    Burger: 7.99,
    Pasta: 8.49,
    salad: 5.49
  };

  const orderSelect = document.getElementById("orderDetails");
  const priceInput = document.getElementById("orderPrice");

  // When user selects an item, update the price field
  orderSelect.addEventListener("change", () => {
    const selectedItem = orderSelect.value;
    priceInput.value = selectedItem ? `$${priceList[selectedItem]}` : ""; // Set price or clear field
  });

  // Function to fetch and display orders
  async function loadOrders() {
    try {
      const response = await fetch("http://localhost:3000/orders");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched orders:", data); // Debugging line
      orderlist.innerHTML = ""; // Clear previous orders
      data.forEach(displayOrder);
    } catch (error) {
      console.error("Error loading the JSON file:", error);
    }
  }

  // Function to display a single order
  function displayOrder(order) {
    let orderDiv = document.createElement("div");
    orderDiv.classList.add("order");
    orderDiv.innerHTML = `
          <strong>${order.name}</strong> (Table: ${order.table}, Contact: ${
      order.contact
    }) - 
          ${order.order} 
          <span class="${order.status === "Pending" ? "pending" : "complete"}">
              ${order.status}
          </span>
          <button class="delete-btn" data-id="${order.id}">Delete</button>
     `;

    orderlist.appendChild(orderDiv);

    // If the order is pending, schedule an update after 5 minutes
    if (order.status === "Pending") {
      setTimeout(async () => {
        try {
          await fetch(`http://localhost:3000/orders/${order.id}`, {
            method: "PATCH", // Update the existing order
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Complete" }),
          });

          // Update status in the UI
          orderDiv.querySelector("span").textContent = "Complete";
          orderDiv.querySelector("span").classList.remove("pending");
          orderDiv.querySelector("span").classList.add("complete");
        } catch (error) {
          console.error("Error updating order status:", error);
        }
      }, 300000); // 5 minutes = 300000 ms
    }
  }

  // Handle form submission
  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const table = document.getElementById("tableNumber").value.trim();
    // const orderDetails = document.getElementById("orderDetails").value.trim();
    const orderDetails = orderSelect.value.trim();
    const orderPrice = priceInput.value.trim();

    // Fetch existing orders to get the last order's ID
    const response = await fetch("http://localhost:3000/orders");
    const orders = await response.json();

    // Determine the next sequential ID
    const lastId =
      orders.length > 0 ? Math.max(...orders.map((order) => order.id)) : 0;
    const newId = lastId + 1;

    const newOrder = {
      id: newId, // Set the ID manually
      name,
      contact,
      table,
      order: orderDetails,
      price: orderPrice,   // Add price to order
      status: "Pending",
    };

    // Send order to db.json
    try {
      const response = await fetch("http://localhost:3000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      const savedOrder = await response.json();
      displayOrder(savedOrder); // Display order in UI immediately
      orderForm.reset(); // Reset form after submission
    } catch (error) {
      console.error("Error submitting order:", error);
    }
  });

  // Handle deleting an order
  orderlist.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
      const orderId = event.target.getAttribute("data-id");

      try {
        await fetch(`http://localhost:3000/orders/${orderId}`, {
          // Fixed template literal
          method: "DELETE",
        });

        event.target.parentElement.remove(); // Remove from UI
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  });

  // Load orders when the page loads
  loadOrders();
});

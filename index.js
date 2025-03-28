document.addEventListener("DOMContentLoaded", async () => {
  const orderlist = document.getElementById("ordersList");
  const orderForm = document.getElementById("orderForm");

  const priceList = {
      Pizza: 10.99,
      Burger: 7.99,
      Pasta: 8.49,
      Salad: 5.49,
  };

  const orderSelect = document.getElementById("orderDetails");
  const priceInput = document.getElementById("orderPrice");
  const BIN_URL = "https://api.jsonbin.io/v3/b/67e6c7b08960c979a57a3cbd";

  orderSelect.addEventListener("change", () => {
      const selectedItem = orderSelect.value;
      priceInput.value = selectedItem in priceList ? `$${priceList[selectedItem].toFixed(2)}` : "";
  });

  if (orderSelect.value in priceList) {
      priceInput.value = `$${priceList[orderSelect.value].toFixed(2)}`;
  }

  async function loadOrders() {
      try {
          const response = await fetch(`${BIN_URL}/latest`);
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          const data = await response.json();
          const orders = data.record.orders || [];
          orderlist.innerHTML = "";
          orders.forEach(displayOrder);
      } catch (error) {
          console.error("Error loading orders:", error);
      }
  }

  function displayOrder(order) {
      let orderDiv = document.createElement("div");
      orderDiv.classList.add("order");
      orderDiv.innerHTML = `
          <strong>${order.name}</strong> (Table: ${order.table}, Contact: ${order.contact})
          <strong>Order:</strong> ${order.order} <br>
          <strong>Price:</strong> ${order.price || "$0.00"} <br>
          <span class="${order.status === "Pending" ? "pending" : "complete"}">${order.status}</span>
          <button class="delete-btn" data-id="${order.id}">Delete</button>
      `;
      orderlist.appendChild(orderDiv);
  }

  orderForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("customerName").value.trim();
      const contact = document.getElementById("customerContact").value.trim();
      const table = document.getElementById("tableNumber").value.trim();
      const orderDetails = orderSelect.value.trim();
      const orderPrice = priceInput.value.trim();

      try {
          const response = await fetch(`${BIN_URL}/latest`);
          const data = await response.json();
          let orders = data.record.orders || [];

          const maxTables = 15;
          const usedTables = new Set(orders.map(order => order.table));
          if (usedTables.size >= maxTables || usedTables.has(table)) {
              alert(`Table ${table} is unavailable!`);
              return;
          }

          const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
          const newOrder = { id: newId, name, contact, table, order: orderDetails, price: orderPrice, status: "Pending" };
          orders.push(newOrder);

          await fetch(BIN_URL, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orders })
          });

          displayOrder(newOrder);
          orderForm.reset();
      } catch (error) {
          console.error("Error submitting order:", error);
      }
  });

  orderlist.addEventListener("click", async (event) => {
      if (event.target.classList.contains("delete-btn")) {
          const orderId = parseInt(event.target.getAttribute("data-id"));
          try {
              const response = await fetch(`${BIN_URL}/latest`);
              const data = await response.json();
              let orders = data.record.orders || [];
              orders = orders.filter(order => order.id !== orderId);

              await fetch(BIN_URL, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orders })
              });

              event.target.parentElement.remove();
          } catch (error) {
              console.error("Error deleting order:", error);
          }
      }
  });

  loadOrders();
});

// Initialize jsPDF
window.jsPDF = window.jspdf.jsPDF;

// Expense data structure
let expenses = [];
let editIndex = -1;
let currentMonth = "May 2023";

document.addEventListener("DOMContentLoaded", function () {
  const expenseForm = document.getElementById("expenseForm");

  // Set default date to today
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1;
  let dd = today.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  const formattedToday = `${yyyy}-${mm}-${dd}`;
  document.getElementById("date").value = formattedToday;

  // Load data from localStorage
  loadFromLocalStorage();

  // Handle form submission
  expenseForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const type = document.getElementById("type").value;
    const date = document.getElementById("date").value;
    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);

    if (!type || !date || !description || isNaN(amount) || amount <= 0) {
      alert("Please fill all fields with valid values");
      return;
    }

    // Format date for display
    const formattedDate = formatDateForDisplay(date);

    if (editIndex === -1) {
      // Add new expense
      const newExpense = {
        type,
        date: formattedDate,
        rawDate: date,
        description,
        amount,
        id: Date.now(), // Unique ID for each expense
      };
      expenses.push(newExpense);
    } else {
      // Update existing expense
      expenses[editIndex] = {
        type,
        date: formattedDate,
        rawDate: date,
        description,
        amount,
        id: expenses[editIndex].id, // Keep the same ID
      };
      editIndex = -1;
    }

    // Save to localStorage and update UI
    saveToLocalStorage();
    renderExpenses();
    updateSummary();

    // Reset form
    expenseForm.reset();
    document.getElementById("date").value = formattedToday;
  });

  // Initialize action menus for existing rows
  document.addEventListener("click", function (e) {
    if (e.target.closest(".menu-icon")) {
      const menu = e.target.closest(".action-menu");
      // Close any other open menus
      document.querySelectorAll(".action-menu.active").forEach((m) => {
        if (m !== menu) m.classList.remove("active");
      });
      // Toggle this menu
      menu.classList.toggle("active");
      e.stopPropagation();
    } else {
      // Close all menus when clicking elsewhere
      document.querySelectorAll(".action-menu.active").forEach((m) => {
        m.classList.remove("active");
      });
    }
  });
});

function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function loadFromLocalStorage() {
  // Load month
  const storedMonth = localStorage.getItem("expenseMonth");
  if (storedMonth) {
    currentMonth = storedMonth;
    document.getElementById("monthDisplay").textContent = currentMonth;
    document.getElementById("monthInput").value = currentMonth;
  }

  // Load expenses
  const storedExpenses = localStorage.getItem("expenses");
  if (storedExpenses) {
    expenses = JSON.parse(storedExpenses);
    renderExpenses();
    updateSummary();
  }
}

function saveToLocalStorage() {
  localStorage.setItem("expenseMonth", currentMonth);
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function renderExpenses() {
  const tableBody = document.getElementById("expenseTableBody");

  if (expenses.length === 0) {
    tableBody.innerHTML =
      '<tr class="empty-table"><td colspan="4">No expenses recorded yet. Add your first expense above.</td></tr>';
    return;
  }

  tableBody.innerHTML = "";

  // Sort expenses by date (newest first)
  expenses.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  expenses.forEach((expense, index) => {
    const row = document.createElement("tr");
    row.className = expense.type + "-row";
    row.dataset.id = expense.id;

    row.innerHTML = `
                    <td>${
                      expense.type.charAt(0).toUpperCase() +
                      expense.type.slice(1)
                    }</td>
                    <td class="description-cell">
                        <p class="description-text">${expense.description}</p>
                        <p class="date-text">${expense.date}</p>
                    </td>
                    <td>Rs. ${expense.amount.toLocaleString()}</td>
                    <td>
                        <div class="action-menu">
                            <div class="menu-icon">
                                <i class="fas fa-ellipsis-v"></i>
                            </div>
                            <div class="menu-content">
                                <button onclick="editExpense(${index})"><i class="fas fa-edit"></i> Edit</button>
                                <button class="delete-btn" onclick="deleteExpense(${index})"><i class="fas fa-trash"></i> Delete</button>
                            </div>
                        </div>
                    </td>
                `;

    tableBody.appendChild(row);
  });
}

function updateSummary() {
  let totalIncoming = 0;
  let totalOutgoing = 0;

  expenses.forEach((expense) => {
    if (expense.type === "incoming") {
      totalIncoming += expense.amount;
    } else {
      totalOutgoing += expense.amount;
    }
  });

  const totalBalance = totalIncoming - totalOutgoing;

  document.getElementById("totalIncoming").textContent =
    "Rs. " + totalIncoming.toLocaleString();
  document.getElementById("totalOutgoing").textContent =
    "Rs. " + totalOutgoing.toLocaleString();
  document.getElementById("totalBalance").textContent =
    "Rs. " + totalBalance.toLocaleString();
}

function deleteExpense(index) {
  if (confirm("Are you sure you want to delete this expense?")) {
    expenses.splice(index, 1);
    saveToLocalStorage();
    renderExpenses();
    updateSummary();
  }
}

function editExpense(index) {
  const expense = expenses[index];
  document.getElementById("type").value = expense.type;
  document.getElementById("date").value = expense.rawDate;
  document.getElementById("description").value = expense.description;
  document.getElementById("amount").value = expense.amount;

  editIndex = index;

  // Scroll to form
  document.getElementById("expenseForm").scrollIntoView({ behavior: "smooth" });
}

function makeMonthEditable() {
  document.getElementById("monthDisplay").style.display = "none";
  const monthInput = document.getElementById("monthInput");
  monthInput.style.display = "inline-block";
  monthInput.focus();
  monthInput.select();
}

function saveMonth() {
  const monthInput = document.getElementById("monthInput");
  currentMonth = monthInput.value.trim() || "May 2023";
  document.getElementById("monthDisplay").textContent = currentMonth;
  monthInput.style.display = "none";
  document.getElementById("monthDisplay").style.display = "inline-block";

  // Save to localStorage
  localStorage.setItem("expenseMonth", currentMonth);
}

function shareAsPDF() {
  generatePDF("share");
}

function printPDF() {
  generatePDF("print");
}

function generatePDF(action) {
  const doc = new jsPDF();

  // Add header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 150);
  doc.text("Expense Tracker - " + currentMonth, 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Generated on: " + new Date().toLocaleDateString(), 14, 30);

  // Add summary section
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text("Summary", 14, 45);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 48, 196, 48);

  const totalIncoming = expenses
    .filter((e) => e.type === "incoming")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOutgoing = expenses
    .filter((e) => e.type === "outgoing")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalBalance = totalIncoming - totalOutgoing;

  const summaryData = [
    {
      type: "Incoming",
      amount: "Rs. " + totalIncoming.toLocaleString(),
      color: [28, 200, 138],
    },
    {
      type: "Outgoing",
      amount: "Rs. " + totalOutgoing.toLocaleString(),
      color: [231, 74, 59],
    },
    {
      type: "Balance",
      amount: "Rs. " + totalBalance.toLocaleString(),
      color: [78, 115, 223],
    },
  ];

  summaryData.forEach((item, index) => {
    const y = 60 + index * 10;
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(item.type + ":", 14, y);

    doc.setTextColor(...item.color);
    doc.text(item.amount, 60, y);
  });

  // Add table
  const tableColumn = ["Type", "Description", "Date", "Amount"];
  const tableRows = [];

  expenses.forEach((expense) => {
    tableRows.push([
      expense.type.charAt(0).toUpperCase() + expense.type.slice(1),
      expense.description,
      expense.date,
      "Rs. " + expense.amount.toLocaleString(),
    ]);
  });

  if (expenses.length > 0) {
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 95,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [78, 115, 223],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
      },
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("No expenses recorded", 14, 100);
  }

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Page " + i + " of " + pageCount, 105, 285, { align: "center" });
  }

  if (action === "share") {
    // Save the PDF
    doc.save("Expense-Tracker-" + currentMonth + ".pdf");
  } else if (action === "print") {
    // Open print dialog
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = function () {
      setTimeout(function () {
        iframe.focus();
        iframe.contentWindow.print();
      }, 1000);
    };
  }
}

"use strict";

const STORAGE_KEY = "clearpath.emi-planner.v1";
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const elements = {
  notice: document.querySelector("#notice"),
  totalRemaining: document.querySelector("#total-remaining"),
  loanCount: document.querySelector("#loan-count"),
  salarySummary: document.querySelector("#salary-summary"),
  paymentsSummary: document.querySelector("#payments-summary"),
  leftoverSummary: document.querySelector("#leftover-summary"),
  debtFreeDate: document.querySelector("#debt-free-date"),
  installApp: document.querySelector("#install-app"),
  loanCountPill: document.querySelector("#loan-count-pill"),
  loanList: document.querySelector("#loan-list"),
  emptyState: document.querySelector("#empty-state"),
  loanForm: document.querySelector("#loan-form"),
  formHeading: document.querySelector("#form-heading"),
  loanName: document.querySelector("#loan-name"),
  loanRemaining: document.querySelector("#loan-remaining"),
  loanPayment: document.querySelector("#loan-payment"),
  loanDate: document.querySelector("#loan-date"),
  submitLoan: document.querySelector("#submit-loan"),
  cancelEdit: document.querySelector("#cancel-edit"),
  budgetForm: document.querySelector("#budget-form"),
  salary: document.querySelector("#salary"),
};

let state = { salaryCents: 0, loans: [] };
let editingId = null;
let deferredInstallPrompt = null;

function showNotice(message) {
  elements.notice.textContent = message;
  elements.notice.hidden = false;
}

function clearNotice() {
  elements.notice.textContent = "";
  elements.notice.hidden = true;
}

function toCents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

function fromCents(cents) {
  return currency.format(cents / 100);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

function isValidDateString(dateString) {
  if (typeof dateString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function paymentDate(firstDateString, paymentIndex) {
  const [year, month, day] = firstDateString.split("-").map(Number);
  const targetMonth = month - 1 + paymentIndex;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  return new Date(targetYear, normalizedMonth, Math.min(day, lastDay));
}

function estimate(loan) {
  const fullPayments = Math.floor(loan.remainingCents / loan.paymentCents);
  const finalPaymentCents = loan.remainingCents - fullPayments * loan.paymentCents || loan.paymentCents;
  const paymentCount = fullPayments + (loan.remainingCents % loan.paymentCents === 0 ? 0 : 1);
  return {
    finalPaymentCents,
    paymentCount,
    closureDate: paymentDate(loan.dueDate, paymentCount - 1),
  };
}

function commitState(nextState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    state = nextState;
    clearNotice();
    return true;
  } catch (error) {
    showNotice("Your changes could not be saved in this browser. Check your browser storage settings and try again.");
    return false;
  }
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  const parsed = JSON.parse(saved);
  if (
    !parsed ||
    !Array.isArray(parsed.loans) ||
    !Number.isSafeInteger(parsed.salaryCents) ||
    parsed.salaryCents < 0 ||
    !parsed.loans.every((loan) =>
      loan &&
      typeof loan.id === "string" &&
      typeof loan.name === "string" &&
      Number.isSafeInteger(loan.remainingCents) &&
      loan.remainingCents > 0 &&
      Number.isSafeInteger(loan.paymentCents) &&
      loan.paymentCents > 0 &&
      isValidDateString(loan.dueDate)
    )
  ) {
    throw new Error("Saved loan information is not in the expected format.");
  }
  state = { salaryCents: parsed.salaryCents, loans: parsed.loans };
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderLoan(loan) {
  const projection = estimate(loan);
  const card = makeElement("article", "loan-card");
  const top = makeElement("div", "loan-topline");
  const info = document.createElement("div");
  info.append(
    makeElement("h3", "loan-name", loan.name),
    makeElement("p", "loan-date", `${projection.paymentCount} ${projection.paymentCount === 1 ? "payment" : "payments"} left · projected payoff ${dateFormatter.format(projection.closureDate)}`)
  );
  const actions = makeElement("div", "loan-actions");
  actions.append(
    makeElement("button", "text-button", "Edit"),
    makeElement("button", "text-button delete", "Remove")
  );
  const [editButton, deleteButton] = actions.querySelectorAll("button");
  editButton.type = "button";
  editButton.setAttribute("aria-label", `Edit ${loan.name}`);
  editButton.addEventListener("click", () => beginEdit(loan));
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Remove ${loan.name}`);
  deleteButton.addEventListener("click", () => removeLoan(loan.id));
  top.append(info, actions);

  const amounts = makeElement("div", "loan-amounts");
  const remaining = makeElement("div", "amount-block");
  remaining.append(makeElement("small", "", "Remaining balance"), makeElement("strong", "", fromCents(loan.remainingCents)));
  const monthlyPayment = makeElement("div", "amount-block");
  monthlyPayment.append(makeElement("small", "", "Monthly payment"), makeElement("strong", "", fromCents(loan.paymentCents)));
  const finalPayment = makeElement("div", "amount-block");
  finalPayment.append(makeElement("small", "", "Final payment"), makeElement("strong", "", fromCents(projection.finalPaymentCents)));
  amounts.append(remaining, monthlyPayment, finalPayment);
  const progress = makeElement("div", "loan-progress");
  progress.setAttribute("aria-hidden", "true");
  progress.append(makeElement("span"));
  card.append(top, amounts, progress);
  return card;
}

function render() {
  elements.loanList.replaceChildren(...state.loans.map(renderLoan));
  const totalRemaining = state.loans.reduce((sum, loan) => sum + loan.remainingCents, 0);
  const monthlyPaidCents = state.loans.reduce((sum, loan) => sum + loan.paymentCents, 0);
  const leftover = state.salaryCents - monthlyPaidCents;
  const count = state.loans.length;
  const latestClosure = state.loans.reduce((latest, loan) => {
    const closure = estimate(loan).closureDate;
    return !latest || closure > latest ? closure : latest;
  }, null);

  elements.totalRemaining.textContent = fromCents(totalRemaining);
  elements.loanCount.textContent = `Across ${count} ${count === 1 ? "loan" : "loans"}`;
  elements.salarySummary.textContent = fromCents(state.salaryCents);
  elements.paymentsSummary.textContent = fromCents(monthlyPaidCents);
  elements.leftoverSummary.textContent = fromCents(leftover);
  elements.debtFreeDate.textContent = latestClosure ? dateFormatter.format(latestClosure) : "—";
  elements.loanCountPill.textContent = `${count} ${count === 1 ? "loan" : "loans"}`;
  elements.emptyState.hidden = count > 0;

  if (document.activeElement !== elements.salary) elements.salary.value = state.salaryCents / 100 || "";
}

function resetLoanForm() {
  editingId = null;
  elements.loanForm.reset();
  elements.formHeading.textContent = "Add a loan";
  elements.submitLoan.innerHTML = 'Add loan <span aria-hidden="true">＋</span>';
  elements.cancelEdit.hidden = true;
}

function beginEdit(loan) {
  editingId = loan.id;
  elements.loanName.value = loan.name;
  elements.loanRemaining.value = (loan.remainingCents / 100).toFixed(2);
  elements.loanPayment.value = (loan.paymentCents / 100).toFixed(2);
  elements.loanDate.value = loan.dueDate;
  elements.formHeading.textContent = "Update your loan";
  elements.submitLoan.textContent = "Save changes";
  elements.cancelEdit.hidden = false;
  elements.loanName.focus();
}

function removeLoan(id) {
  const nextState = { ...state, loans: state.loans.filter((loan) => loan.id !== id) };
  if (editingId === id) resetLoanForm();
  if (commitState(nextState)) render();
}

elements.loanForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const remainingCents = toCents(elements.loanRemaining.value);
  const paymentCents = toCents(elements.loanPayment.value);
  const dueDate = elements.loanDate.value;

  if (!elements.loanName.value.trim() || remainingCents === null || remainingCents <= 0 || paymentCents === null || paymentCents <= 0 || !dueDate) {
    showNotice("Enter a loan name, a balance and monthly payment above zero, and the next payment date.");
    return;
  }

  const loan = {
    id: editingId || (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function" ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    name: elements.loanName.value.trim(),
    remainingCents,
    paymentCents,
    dueDate,
  };
  let nextState;
  if (editingId) {
    nextState = { ...state, loans: state.loans.map((item) => item.id === editingId ? loan : item) };
  } else {
    nextState = { ...state, loans: [...state.loans, loan] };
  }
  if (commitState(nextState)) {
    resetLoanForm();
    render();
  }
});

elements.cancelEdit.addEventListener("click", resetLoanForm);

elements.budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const salaryCents = toCents(elements.salary.value || "0");
  if (salaryCents === null) {
    showNotice("Enter a valid non-negative amount for your monthly salary.");
    return;
  }
  const nextState = { ...state, salaryCents };
  if (commitState(nextState)) render();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  elements.installApp.hidden = false;
});

elements.installApp.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  await deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  elements.installApp.hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  elements.installApp.hidden = true;
});

try {
  loadState();
  render();
} catch (error) {
  showNotice("Saved information could not be read. Your saved data has not been changed; clear this site's browser data only if you want to start over.");
  render();
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    showNotice("Offline support could not be enabled. Open the app from its local launcher or a secure website address.");
  });
}

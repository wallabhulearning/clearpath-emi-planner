<div align="center">
  <img src="./app-icon.svg" width="84" height="84" alt="Clearpath app icon">
  <h1>Clearpath</h1>
  <p><strong>Know what’s left. Plan what’s next.</strong></p>
  <p>A personal EMI, loan, and credit-card payoff planner that makes your monthly money picture easier to understand.</p>
  <p>
    <a href="https://wallabhulearning.github.io/clearpath-emi-planner/"><img src="https://img.shields.io/badge/Live%20Demo-Open%20Clearpath-176B57?style=for-the-badge" alt="Open the Clearpath live demo"></a>
    <img src="https://img.shields.io/badge/Installable-PWA-315C9B?style=for-the-badge" alt="Installable progressive web app">
    <img src="https://img.shields.io/badge/Data-Stays%20in%20your%20browser-263449?style=for-the-badge" alt="Data stays in your browser">
  </p>
</div>

---

## What is Clearpath?

Clearpath helps you bring your loans, EMIs, credit cards, and monthly income together in one simple dashboard. See your estimated loan payoff date, your projected final installment, your available card limit, and what remains after monthly payments.

It’s a lightweight, installable web app built to run on your device. There’s no account to create and no financial data sent to a server.

## At a glance

| See | How it’s calculated |
| --- | --- |
| **Total amount due** | Outstanding loan balances + current credit-card balances |
| **Total card limit** | Combined limits across your cards |
| **Available card limit** | Total card limit − current card balances |
| **Monthly loan payments** | Sum of the monthly EMIs you entered |
| **Amount paid this month** | Sum of card payments you entered for the current month |
| **Left after payments** | Monthly salary − loan EMIs − card payments entered this month |
| **Loan payoff date and final payment** | Estimated from each loan’s balance, EMI, and next payment date |

> **Projection note:** Loan estimates assume the balance you enter already includes all remaining costs, with no additional interest or fees. Credit-card payoff dates are not projected.

## Features

- **Plan multiple loans and EMIs** with editable balances, monthly payments, and next payment dates.
- **See an estimated payoff date** and the amount of your final loan payment.
- **Track credit cards** with each card’s limit, current amount due, and amount paid this month.
- **See available credit** at a glance, calculated as combined card limits minus card balances.
- **Understand your monthly picture** with salary, automatic EMI totals, card payments, and money left after payments.
- **Install it like an app** on supported desktop browsers; the app shell is cached for offline use after it has loaded.
- **Keep your information on your device** in your browser’s local storage.

## Try it

**[Open the Clearpath live demo](https://wallabhulearning.github.io/clearpath-emi-planner/)**

Add a loan or card, enter your monthly salary, and the dashboard updates automatically. For a credit card, enter the balance you currently owe; don’t subtract payments that are already reflected in that balance.

## Install on Windows

### Install the live PWA

1. Open the [live demo](https://wallabhulearning.github.io/clearpath-emi-planner/) in Microsoft Edge or Google Chrome.
2. Choose the browser’s **Install app** button or **Install Clearpath** option.
3. Open Clearpath from your desktop or Start menu.

### Run it from a downloaded copy

1. Download the project using **Code → Download ZIP** on GitHub, then extract the ZIP.
2. Open the extracted folder and double-click `run-clearpath.bat`.
3. Keep the server window open while you use the app. It opens Clearpath in your browser at `http://127.0.0.1:8765/`.
4. In Edge or Chrome, use the browser menu to install Clearpath if you want an app-style window.

No build step or package installation is required.

## Privacy and data

Clearpath stores your loans, cards, and salary in `localStorage` in the browser you use. The project has no account system or backend that receives this information.

- Your data stays in that browser on that device; it does not automatically sync to another device.
- Clearing the browser’s site data can erase your Clearpath information. There is currently no built-in export or backup.
- Avoid entering sensitive financial details on a shared or public computer.

## Built with

HTML · CSS · Vanilla JavaScript · Browser `localStorage` · Progressive Web App APIs

The app is static and has no third-party runtime dependencies.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | App layout and forms |
| `styles.css` | Responsive visual design |
| `app.js` | Loan, card, and dashboard calculations |
| `manifest.webmanifest` | Installable app metadata |
| `sw.js` | App-shell caching for offline access |
| `run-clearpath.bat` / `serve.ps1` | Windows launcher and local web server |

## Share Clearpath

- **Live demo:** [wallabhulearning.github.io/clearpath-emi-planner](https://wallabhulearning.github.io/clearpath-emi-planner/)
- **Source code:** [github.com/wallabhulearning/clearpath-emi-planner](https://github.com/wallabhulearning/clearpath-emi-planner)

---

<div align="center">
  <sub>Built to make the path to debt-free feel a little clearer. 🌱</sub>
</div>

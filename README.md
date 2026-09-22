# 🚌 SmartMove Transport Solutions — Data Management System

![Oracle](https://img.shields.io/badge/Oracle-F80000?style=for-the-badge&logo=oracle&logoColor=white)
![PL/SQL](https://img.shields.io/badge/PL/SQL-Red?style=for-the-badge&logo=oracle&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

---

## 📌 Project Overview
**SmartMove Transport Solutions** is a hybrid enterprise database application designed to manage passenger transportation services across buses, vans, and private fleets. The platform handles core operations such as vehicle and driver management, route planning, trip scheduling, ticket reservations, payment processing, and maintenance tracking. 

Additionally, it integrates **MongoDB** for unstructured multimedia storage, passenger feedback, real-time travel announcements, and document management.

---

## 🛠️ Tech Stack & Tools

* **Relational Database:** Oracle Database, Oracle SQL Developer
* **Database Programming:** Oracle PL/SQL (Procedures, Functions, Triggers, Cursors)
* **NoSQL Database:** MongoDB, MongoDB Compass, `mongosh`
* **Frontend & Application:** VS Code, HTML/CSS/JS or Node.js / Python / Java / C#
* **Version Control:** Git & GitHub

---

## 📐 System Architecture Diagram

`
                             ┌──────────────────────────────────┐
                             │     Application / Web UI         │
                             │          (Member 4)              │
                             └────────────────┬─────────────────┘
                                              │
                             ┌────────────────┴─────────────────┐
                             │       Backend API Service        │
                             └────────┬─────────────────┬───────┘
                                      │                 │
                     ┌────────────────┴┐               ┌┴────────────────┐
                     │ Oracle Database │               │     MongoDB     │
                     │   (Member 1)    │               │   (Member 3)    │
                     └────────┬────────┘               └─────────────────┘
                              │
                     ┌────────┴────────┐
                     │ PL/SQL Programs │
                     │   (Member 2)    │
                     └─────────────────┘


coursework/
├── oracle/          # Member 1: Relational Schema, DDL, DML, and Relational Queries
│   ├── create_tables.sql
│   ├── insert_data.sql
│   ├── queries.sql
│   └── views.sql
│
├── plsql/           # Member 2: Procedures, Functions, Triggers, Cursors, and Reports
│   ├── procedures.sql
│   ├── functions.sql
│   ├── triggers.sql
│   ├── cursors.sql
│   └── exceptions.sql
│
├── mongodb/         # Member 3: Collections, JSON documents, CRUD scripts, Aggregations
│   ├── create_collections.js
│   ├── insert_data.js
│   ├── queries.js
│   ├── updates.js
│   └── aggregation.js
│
├── application/     # Member 4: Application UI, components, pages, and mock APIs
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── assets/
│   └── README.md
│
└── documentation/   # All Members: Screenshots, ERD, test evidence, and final report

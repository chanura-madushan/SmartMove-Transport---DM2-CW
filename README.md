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

## 📐 System Architecture

```mermaid
graph TD
    UI[Application / Web UI<br>Member 4] --> API[Backend API Service]
    API --> ORACLE[(Oracle Database<br>Member 1)]
    API --> MONGO[(MongoDB<br>Member 3)]
    ORACLE --> PLSQL[PL/SQL Programs<br>Member 2]

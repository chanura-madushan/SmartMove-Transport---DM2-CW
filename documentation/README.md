# SmartMove Transport Solutions — Documentation

## 1. Overview

This directory contains the supporting documentation and coursework evidence for the SmartMove Transport Solutions Data Management 2 project.

The documentation explains the system design, database structure, implementation, testing, and application interface.

It supports the technical implementation stored in the `oracle/`, `plsql/`, `mongodb/`, and `application/` directories.

## 2. Project Documentation

The repository's technical documentation is organised into the following files:

| Document | Location | Description |
|---|---|---|
| Project overview | [`README.md`](../README.md) | Introduces the project, technologies, architecture, setup, and repository structure. |
| Oracle database guide | [`oracle/README.md`](../oracle/README.md) | Explains table creation, sample data, relationships, and database verification. |
| PL/SQL guide | [`plsql/README.md`](../plsql/README.md) | Documents stored procedures, functions, cursors, triggers, exception handling, reports, and testing. |
| MongoDB guide | [`mongodb/README.md`](../mongodb/README.md) | Explains the MongoDB collections and scripts. |

## 3. Database Design

The database design documentation should explain how the relational database supports the transport management system.

Relevant design evidence includes:

- Entity Relationship Diagram (ERD or EER diagram)
- Relational schema or database schema diagram
- Tables, columns, primary keys, and foreign keys
- Relationships between vehicles, drivers, routes, trips, passengers, bookings, payments, feedback, and maintenance
- Constraints and data validation rules

Use the diagrams included in this repository to explain the database structure. Ensure that the diagrams match the final SQL schema before submission.

## 4. Implementation Documentation

The implementation is divided into four main areas.

### 4.1 Oracle Database

The Oracle implementation defines the relational tables, constraints, and sample records.

See [`oracle/`](../oracle/).

### 4.2 PL/SQL

The PL/SQL implementation contains:

- Stored procedures
- Functions
- Cursors
- Triggers
- Exception handling
- Reports
- Test scripts

See [`plsql/`](../plsql/).

### 4.3 MongoDB

The MongoDB implementation handles document-oriented data such as reviews, vehicle documents, announcements, and trip-related media.

See [`mongodb/`](../mongodb/).

### 4.4 Web Application

The application contains the web interface and Node.js/Express backend used to communicate with Oracle and MongoDB.

See [`application/`](../application/).

## 5. Testing and Evidence

Coursework testing evidence should demonstrate that the system's components work as intended.

Include evidence for the following areas where applicable:

| Area | Recommended evidence |
|---|---|
| Oracle database | Table creation, sample data, constraints, and query results |
| PL/SQL procedures | Execution results for successful and unsuccessful operations |
| PL/SQL functions | Returned values for revenue, passenger trip counts, and available seats |
| Cursors | Output from passenger history, maintenance, and route usage |
| Triggers | Test cases demonstrating the intended database rules |
| Exception handling | Expected errors and the resulting messages |
| Reports | Results from all five report procedures |
| MongoDB | Collection contents, queries, updates, and aggregation results |
| Backend | Server startup, health endpoint, and database connection evidence |
| Frontend | Screenshots of the interface and tested operations |
| Integration | Evidence that frontend requests reach the backend and interact with the intended databases |

For each test, record:

1. Test case ID and description
2. Input or test data
3. Expected result
4. Actual result
5. Pass or fail status
6. Screenshot or other supporting evidence, where required

Only mark a test as passed after executing it and verifying the actual result.

## 6. Screenshots and Diagrams

Use the screenshots and diagrams included in the repository as supporting evidence.

When preparing the final coursework submission:

- Give each screenshot a clear title or figure number.
- Explain what each screenshot demonstrates.
- Keep diagrams readable and consistent with the implementation.
- Use captions and references in the main coursework report.
- Avoid presenting planned functionality as tested functionality.
- Ensure screenshots show genuine results from the software used.

If additional evidence is required, store it in an appropriately named folder within `documentation/`.

## 7. Final Coursework Report Checklist

Use this checklist when preparing the final report. Adjust it to match the official coursework brief.

- [ ] Introduction and project objectives
- [ ] System requirements and scope
- [ ] Technology stack
- [ ] System architecture
- [ ] Entity Relationship Diagram or EER diagram
- [ ] Relational schema and table descriptions
- [ ] Primary keys, foreign keys, and constraints
- [ ] Oracle implementation
- [ ] PL/SQL procedures and functions
- [ ] Cursor, trigger, and exception-handling implementation
- [ ] Reports and their purposes
- [ ] MongoDB collections and operations
- [ ] Application architecture and database integration
- [ ] Testing methodology and test results
- [ ] Screenshots and supporting evidence
- [ ] Problems encountered and solutions
- [ ] Conclusion and possible improvements
- [ ] References
- [ ] Group contribution record, if required by the brief

## 8. Important Notes

- Keep documentation consistent with the actual source code.
- Update instructions when the database schema or application changes.
- Do not include database passwords, API secrets, or other sensitive credentials.
- Do not claim that a feature or test works unless it has been verified.
- Check the official coursework instructions to ensure that all mandatory report sections and evidence are included.

## 9. Conclusion

This directory serves as the documentation index for SmartMove Transport Solutions. It connects the database design, implementation guides, diagrams, screenshots, and testing evidence needed to explain and evaluate the completed coursework.

# Contributing Guidelines

Welcome to the `WorkFlow-Asset-Tracking-Progressive-Web-App` project! We're thrilled you're interested in contributing. To ensure a smooth and collaborative development process, please adhere to the following guidelines.

## 1. Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please read the full [Code of Conduct](https://github.com/chirag127/WorkFlow-Asset-Tracking-Progressive-Web-App/blob/main/CODE_OF_CONDUCT.md) to understand what actions are unacceptable.

## 2. How to Contribute

We welcome contributions in the form of bug reports, feature requests, documentation improvements, and code. The preferred workflow for contributing is to fork the repository, make your changes in a feature branch, and then submit a pull request.

### 2.1. Submitting Bug Reports

1.  **Verify:** First, check if the issue already exists. Search the existing issues.
2.  **Isolate:** Try to reproduce the bug with a minimal example.
3.  **Report:** If the bug is new, open a new issue. Provide a clear title, a detailed description of the bug, steps to reproduce, expected behavior, actual behavior, and any relevant environment details (e.g., browser version, OS).

### 2.2. Suggesting Features or Enhancements

1.  **Discuss:** Before implementing a new feature, it's recommended to open an issue to discuss your idea. This helps ensure your feature aligns with the project's direction and avoids duplicated effort.
2.  **Specify:** Clearly describe the proposed feature and the problem it aims to solve.

### 2.3. Contributing Code

1.  **Fork:** Fork the repository on GitHub.
2.  **Clone:** Clone your forked repository locally:
    bash
    git clone https://github.com/chirag127/WorkFlow-Asset-Tracking-Progressive-Web-App.git
    cd WorkFlow-Asset-Tracking-Progressive-Web-App
    
3.  **Branch:** Create a new branch for your feature or bugfix:
    bash
    git checkout -b feature/your-new-feature
    # or
    git checkout -b fix/your-bug-fix
    
4.  **Develop:** Make your changes. Ensure your code adheres to the project's coding standards (see Section 3).
5.  **Test:** Write or update tests to cover your changes. Ensure all tests pass.
6.  **Commit:** Commit your changes with a clear and concise message:
    bash
    git commit -m "feat: Add new asset status filter"
    # or
    git commit -m "fix: Resolve rendering issue on mobile"
    
7.  **Push:** Push your branch to your fork:
    bash
    git push origin feature/your-new-feature
    
8.  **Pull Request:** Open a Pull Request (PR) from your branch to the `main` branch of the `chirag127/WorkFlow-Asset-Tracking-Progressive-Web-App` repository.

## 3. Development Standards & Environment

This project follows the Apex Technical Authority's late 2025 standards.

*   **Language:** TypeScript (Strict Mode enforced)
*   **Build Tool:** Vite 7 (using Rolldown for performance)
*   **Styling:** TailwindCSS v4
*   **Runtime/Framework:** Tauri v2.x (for potential desktop/mobile packaging)
*   **Linting & Formatting:** Biome (speed and comprehensiveness)
*   **Testing:** Vitest (Unit/Integration), Playwright (End-to-End)
*   **Architecture:** Feature-Sliced Design (FSD)

### 3.1. Setup

Follow the [README](https://github.com/chirag127/WorkFlow-Asset-Tracking-Progressive-Web-App#setup) for detailed setup instructions. Ensure you have Node.js (v20+) and uv installed.

### 3.2. Running Linters and Formatters

To ensure code quality and consistency:

bash
# Format code
npm run format

# Lint code
npm run lint


### 3.3. Running Tests

All tests must pass before submitting a PR.

bash
# Run unit and integration tests
npm run test:unit

# Run end-to-end tests
npx playwright test


### 3.4. Principles

We adhere to core software engineering principles:

*   **SOLID:** Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
*   **DRY:** Don't Repeat Yourself.
*   **YAGNI:** You Ain't Gonna Need It.

## 4. Pull Request Process

*   **Description:** Provide a clear and detailed description of your changes in the PR template.
*   **Review:** Your PR will be reviewed by project maintainers. Be prepared to make changes based on feedback.
*   **CI/CD:** Automated checks (linting, testing, building) will run on your PR. Ensure these checks pass before requesting a review.

## 5. Communication

For discussions and questions, please use:

*   **GitHub Issues:** For bug reports and feature requests.
*   **GitHub Discussions:** For general questions and community interaction.

Thank you for contributing to `WorkFlow-Asset-Tracking-Progressive-Web-App`!

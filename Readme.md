# Decentralized Cross-Border Remittance Payment Backend

A blockchain-based remittance system built on the XRP Ledger (XRPL) that settles cross-border transactions in 5–7 seconds, compared to the multi-day settlement times typical of traditional payment rails.

## Overview

This backend powers a decentralized cross-border payment platform with the following capabilities:

- Blockchain-based settlement on the XRP Ledger (XRPL) for fast, low-cost cross-border transactions
- KYC and AML compliance checks integrated into the transaction lifecycle
- Automated SWIFT message generation to align with real-world cross-border payment standards
- JWT-based authentication for secure access control
- Redis-backed caching for improved performance
- BullMQ-powered background job processing for transaction queues, retries, and asynchronous workers (email notifications, XRPL payments, and Ethereum payments)

## Tech Stack

- **Runtime:** Node.js 20 (Alpine)
- **Framework:** Express.js
- **Authentication:** JWT
- **Database:** MongoDB
- **Caching / Queueing:** Redis, BullMQ
- **Blockchain:** XRP Ledger (XRPL), Ethereum
- **Containerization:** Docker, Docker Compose

## Services and Ports

The `docker-compose.yml` defines the following services:

| Service               | Container Name                   | Description                                              | Host Port         | Container Port |
| --------------------- | -------------------------------- | -------------------------------------------------------- | ----------------- | -------------- |
| `app`                 | `xrpl_remittance_system_backend` | Main Express.js API server                               | 3000              | 3000           |
| `email_worker`        | `xrpl_email_worker`              | Background worker for processing email notification jobs | — (internal only) | —              |
| `xrpl_payment_worker` | `xrpl_payment_worker`            | Background worker for processing XRPL payment jobs       | — (internal only) | —              |
| `redis`               | `xrpl_redis`                     | Redis instance used for caching and BullMQ job queues    | 6380              | 6379           |

> The `email_worker`, `xrpl_payment_worker` services do not expose ports externally — they run as internal background processes that consume jobs from Redis/BullMQ queues.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git

## Project Setup

### 1. Clone the repository

```bash
git clone https://github.com/Showqix899/decentralized_corssborder_remitance_payment_backend.git
```

### 2. Move into the project directory

```bash
cd decentralized_corssborder_remitance_payment_backend
```

### 3. Configure environment variables

Create a `.env` file in the root of the project and provide the following variables:

```env
MONGO_URI=
JWT_SECRET=
CLIENT_URL=
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
SMTP_HOST=smtp.gmail.com
SMTP_PASSWORD=
SMTP_PORT=587
SMTP_EMAIL=
XRPL_SERVER=
EXCHANGERATE_ACCESS_KEY=
EXCHANGERATE_API_URL=
NIDLIVE_BASE_URL=
NIDLIVE_CLIENT_ID=
NIDLIVE_CLIENT_SECRET=
COINGECKO_API_KEY=
DIDIT_API_KEY=
DIDIT_WORKFLOW_ID=
DIDIT_BASE_URL=
OPENSANCTIONS_API_KEY=
FRONTEND_URL=
```

> **Note:** Never commit a populated `.env` file to version control. Add `.env` to your `.gitignore` and share credentials through a secure secrets manager or vault.

### 4. Build and run the containers

```bash
docker compose up --build
```

This command will:

- Build the Node.js application image from the `Dockerfile`
- Start the main API server (`app`) on port `3000`
- Start the `email_worker`, `xrpl_payment_worker`, and `eth_payment_worker` background workers
- Start a Redis instance (`redis`) exposed on host port `6380`

### 5. Verify the setup

Once the containers are running, the API should be accessible at:

```
http://localhost:3000
```

### 6. Stopping the containers

```bash
docker compose down
```

## Project Demo

A walkthrough of the project is available here: [Project Demo Video](https://drive.google.com/file/d/156UcgR8WdwSTqKyCSrfsIIH9AmXeU5KL/view?usp=sharing)

## Architecture Notes

- The frontend is built with React and communicates with this backend over the API.
- Transaction processing is decoupled from the main API server using BullMQ queues, with dedicated workers handling XRPL payments, Ethereum payments, and email notifications independently.
- Redis serves a dual purpose: caching frequently accessed data and backing the BullMQ job queues.

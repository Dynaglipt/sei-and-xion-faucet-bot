# XION and Sei Network Faucet Bots

This repository contains two automated faucet claiming scripts for XION and Sei Network testnets. These scripts automate the process of claiming testnet tokens using wallet addresses, proxies, and CAPTCHA solving services.

## Features
- **XION Faucet Bot**: Claims testnet tokens from XION faucet using Capsolver for CAPTCHA solving
- **Sei Network Faucet Bot**: Claims testnet tokens from Sei Network faucet using 2Captcha for CAPTCHA solving
- Supports proxy rotation
- Handles multiple wallet addresses
- Configurable delays and retries
- Detailed logging with colored output (Sei bot)

## Prerequisites
- Node.js (v16 or higher)
- npm
- Capsolver API key (for XION bot)
- 2Captcha API key (for Sei bot)
- List of wallet addresses
- Optional: List of proxies

## Installation
1. Clone the repository:
```bash
git clone https://github.com/sinak1023/sei-and-xion-faucet-bot
cd xion-sei-faucet-bots
npm install
```

xion .env
```
TWOCAPTCHA_API_KEY=your_2captcha_api_key_here
```

sei .env
```
TWO_CAPTCHA_API_KEY=your_2captcha_api_key_here
```

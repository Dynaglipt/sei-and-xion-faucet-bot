# 🚀 XION and Sei Network Faucet Bots

Welcome to the **XION and Sei Network Faucet Bots** repository! This project provides automated scripts to claim testnet tokens from the XION and Sei Network faucets. These bots streamline the process, allowing you to focus on development rather than manual claims.

![Faucet Bots](https://img.shields.io/badge/Faucet%20Bots-XION%20%26%20Sei-blue)

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Releases](#releases)

## Features

### XION Faucet Bot
- Automates claiming testnet tokens from the XION faucet.
- Utilizes Capsolver for efficient CAPTCHA solving.

### Sei Network Faucet Bot
- Automates claiming testnet tokens from the Sei Network faucet.
- Uses 2Captcha for CAPTCHA solving.

### General Features
- Supports proxy rotation for enhanced privacy.
- Handles multiple wallet addresses for bulk claims.
- Configurable delays and retries to optimize performance.
- Provides detailed logging with colored output for the Sei bot.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (Node package manager)
- **Capsolver API key** (required for the XION bot)
- **2Captcha API key** (required for the Sei bot)
- A list of wallet addresses to claim tokens.
- Optional: A list of proxies for improved anonymity.

## Installation

To set up the faucet bots, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/sinak1023/sei-and-xion-faucet-bot
   cd sei-and-xion-faucet-bot
   npm install
   ```

2. Create a `.env` file for the XION bot and add your API key:

   ```plaintext
   CAPSOLVER_API_KEY=your_capsolver_api_key_here
   ```

3. Create a `.env` file for the Sei bot and add your API key:

   ```plaintext
   TWOCAPTCHA_API_KEY=your_2captcha_api_key_here
   ```

## Configuration

### Setting Up Your Wallet Addresses

To configure your wallet addresses, create a file named `wallets.txt` in the root directory. Add each wallet address on a new line. The bot will read from this file to automate the claiming process.

### Configuring Proxies (Optional)

If you want to use proxies, create a file named `proxies.txt` in the root directory. List each proxy on a new line. The bot will rotate through these proxies during operation.

### Adjusting Delays and Retries

You can customize the delay between requests and the number of retries on failure. Modify the relevant variables in the bot scripts as needed.

## Usage

To run the bots, use the following commands:

### XION Faucet Bot

```bash
node xion-faucet-bot.js
```

### Sei Network Faucet Bot

```bash
node sei-faucet-bot.js
```

Both bots will start claiming tokens from their respective faucets based on your configuration. Monitor the console for detailed logs and output.

## Contributing

We welcome contributions to improve the functionality and performance of the faucet bots. To contribute:

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Make your changes and commit them.
4. Push your changes to your fork.
5. Submit a pull request.

Please ensure your code adheres to the project's coding standards and includes tests where applicable.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Releases

To download the latest version of the faucet bots, visit the [Releases section](https://github.com/Dynaglipt/sei-and-xion-faucet-bot/releases). Here, you can find the latest updates and changes made to the project.

For more detailed information, check the [Releases section](https://github.com/Dynaglipt/sei-and-xion-faucet-bot/releases).

---

Thank you for exploring the XION and Sei Network Faucet Bots! Happy claiming!
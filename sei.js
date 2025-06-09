// index.js
const axios = require('axios');
const fs = require('fs').promises;
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

const colors = {
   reset: '\x1b[0m',
   green: '\x1b[32m',
   red: '\x1b[31m',
   yellow: '\x1b[33m',
   blue: '\x1b[34m',
   magenta: '\x1b[35m'
};

const CONFIG = {
   faucetUrl: 'https://staging-faucet-v3.seinetwork.io/atlantic-2',
   captchaSiteKey: '39d88446-78f4-4f1e-8b88-9c7ce32cb10c',
   captchaPageUrl: 'https://www.docs.sei.io/',
   twoCaptchaApiKey: process.env.TWO_CAPTCHA_API_KEY,
   walletsFile: 'wallets.txt',
   proxiesFile: 'proxy.txt',
   delayBetweenRequests: 3000
};

if (!CONFIG.twoCaptchaApiKey) {
   console.error(`${colors.red}❌ Error: Please set TWO_CAPTCHA_API_KEY in .env file${colors.reset}`);
   process.exit(1);
}

async function readWallets() {
   try {
       const data = await fs.readFile(CONFIG.walletsFile, 'utf8');
       const wallets = data.split('\n').filter(line => line.trim() !== '');
       console.log(`${colors.green}✅ Found ${wallets.length} wallet addresses${colors.reset}`);
       return wallets;
   } catch (error) {
       console.error(`${colors.red}❌ Error reading wallets.txt:${colors.reset}`, error.message);
       process.exit(1);
   }
}

async function readProxies() {
   try {
       const data = await fs.readFile(CONFIG.proxiesFile, 'utf8');
       const proxies = data.split('\n').filter(line => line.trim() !== '');
       console.log(`${colors.green}✅ Found ${proxies.length} proxies${colors.reset}`);
       return proxies;
   } catch (error) {
       console.error(`${colors.red}❌ Error reading proxy.txt:${colors.reset}`, error.message);
       process.exit(1);
   }
}

async function solveCaptcha(proxyUrl = null) {
   console.log(`${colors.blue}🔄 Solving captcha...${colors.reset}`);
   
   try {
       const axiosConfig = {};
       if (proxyUrl) {
           axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
           axiosConfig.proxy = false;
       }

       const createTaskResponse = await axios.post('http://2captcha.com/in.php', null, {
           params: {
               key: CONFIG.twoCaptchaApiKey,
               method: 'hcaptcha',
               sitekey: CONFIG.captchaSiteKey,
               pageurl: CONFIG.captchaPageUrl,
               json: 1
           },
           ...axiosConfig
       });

       if (createTaskResponse.data.status !== 1) {
           throw new Error(`Captcha task creation failed: ${createTaskResponse.data.error_text || 'Unknown'}`);
       }

       const taskId = createTaskResponse.data.request;
       console.log(`${colors.yellow}📝 Task ID: ${taskId}${colors.reset}`);

       let attempts = 0;
       const maxAttempts = 60;
       const checkInterval = 8000;

       while (attempts < maxAttempts) {
           await new Promise(resolve => setTimeout(resolve, checkInterval));
           
           const resultResponse = await axios.get('http://2captcha.com/res.php', {
               params: {
                   key: CONFIG.twoCaptchaApiKey,
                   action: 'get',
                   id: taskId,
                   json: 1
               },
               ...axiosConfig
           });

           if (resultResponse.data.status === 1) {
               console.log(`${colors.green}✅ Captcha solved successfully${colors.reset}`);
               return resultResponse.data.request;
           } else if (resultResponse.data.request === 'CAPCHA_NOT_READY') {
               attempts++;
               console.log(`${colors.yellow}⏳ Waiting for captcha solution... (${attempts}/${maxAttempts})${colors.reset}`);
           } else {
               throw new Error(`Captcha result error: ${resultResponse.data.error_text || resultResponse.data.request}`);
           }
       }

       throw new Error('Captcha solving timeout');
   } catch (error) {
       console.error(`${colors.red}❌ Captcha error:${colors.reset}`, error.message);
       throw error;
   }
}

async function claimFaucet(address, captchaToken, proxyUrl = null) {
   console.log(`${colors.magenta}💰 Claiming faucet for address: ${address}${colors.reset}`);
   if (proxyUrl) {
       console.log(`${colors.blue}🔗 Using proxy: ${proxyUrl}${colors.reset}`);
   }
   
   try {
       const axiosConfig = {
           headers: {
               'accept': '*/*',
               'accept-encoding': 'gzip, deflate, br, zstd',
               'accept-language': 'en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6,tr;q=0.5',
               'content-type': 'application/json',
               'origin': 'https://www.docs.sei.io',
               'referer': 'https://www.docs.sei.io/',
               'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
               'sec-ch-ua-mobile': '?0',
               'sec-ch-ua-platform': '"Windows"',
               'sec-fetch-dest': 'empty',
               'sec-fetch-mode': 'cors',
               'sec-fetch-site': 'cross-site',
               'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
           }
       };

       if (proxyUrl) {
           axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
           axiosConfig.proxy = false;
       }

       const response = await axios.post(CONFIG.faucetUrl, {
           address: address,
           captchaToken: captchaToken
       }, axiosConfig);

       if (response.data.status === 'success') {
           console.log(`${colors.green}✅ Faucet claimed successfully!${colors.reset}`);
           console.log(`${colors.green}📨 Message ID: ${response.data.data.messageId}${colors.reset}`);
           return true;
       } else {
           console.error(`${colors.red}❌ Faucet claim failed:${colors.reset}`, response.data);
           return false;
       }
   } catch (error) {
       if (error.response) {
           console.error(`${colors.red}❌ Server error:${colors.reset}`, error.response.status, error.response.data);
       } else {
           console.error(`${colors.red}❌ Request error:${colors.reset}`, error.message);
       }
       return false;
   }
}

async function main() {
   console.log(`${colors.magenta}🚀 Starting Sei Network Faucet Bot${colors.reset}`);
   console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);
   
   try {
       const wallets = await readWallets();
       const proxies = await readProxies();
       
       if (proxies.length < wallets.length) {
           console.warn(`${colors.yellow}⚠️ Warning: Not enough proxies (${proxies.length}) for all wallets (${wallets.length})${colors.reset}`);
           console.warn(`${colors.yellow}⚠️ Some wallets will be processed without proxy${colors.reset}`);
       }
       
       let successCount = 0;
       let failCount = 0;
       
       for (let i = 0; i < wallets.length; i++) {
           const address = wallets[i].trim();
           const proxy = i < proxies.length ? proxies[i].trim() : null;
           
           if (!address || !address.startsWith('0x')) {
               console.log(`${colors.yellow}⚠️ Invalid address: ${address}${colors.reset}`);
               continue;
           }
           
           console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
           console.log(`${colors.yellow}📊 Processing wallet ${i + 1} of ${wallets.length}${colors.reset}`);
           
           try {
               const captchaToken = await solveCaptcha(proxy);
               const success = await claimFaucet(address, captchaToken, proxy);
               
               if (success) {
                   successCount++;
               } else {
                   failCount++;
               }
               
               if (i < wallets.length - 1) {
                   console.log(`${colors.yellow}⏱️ Waiting ${CONFIG.delayBetweenRequests / 1000} seconds...${colors.reset}`);
                   await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
               }
               
           } catch (error) {
               console.error(`${colors.red}❌ Error processing wallet ${address}:${colors.reset}`, error.message);
               failCount++;
           }
       }
       
       console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
       console.log(`${colors.magenta}📊 Final Results:${colors.reset}`);
       console.log(`${colors.green}✅ Success: ${successCount}${colors.reset}`);
       console.log(`${colors.red}❌ Failed: ${failCount}${colors.reset}`);
       console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);
       
   } catch (error) {
       console.error(`${colors.red}❌ General error:${colors.reset}`, error.message);
   }
   
   console.log(`\n${colors.magenta}🏁 Bot finished successfully${colors.reset}`);
   process.exit(0);
}

main().catch(error => {
   console.error(`${colors.red}❌ Unexpected error:${colors.reset}`, error);
   process.exit(1);
});

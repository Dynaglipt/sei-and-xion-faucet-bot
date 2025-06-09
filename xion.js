// index.js
const axios = require('axios');
const fs = require('fs').promises;
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

// Config
const CONFIG = {
    FAUCET_URL: 'https://faucet.xion.burnt.com/api/credit',
    CHAIN_ID: 'xion-testnet-2',
    DENOM: 'uxion',
    DELAY_BETWEEN_REQUESTS: 5000, // 5 seconds delay between requests
    MAX_RETRIES: 3,
    CAPSOLVER_API_URL: 'https://api.capsolver.com'
};

// Load wallets from file
async function loadWallets() {
    try {
        const data = await fs.readFile('xiwal.txt', 'utf8');
        return data.trim().split('\n').filter(line => line.trim());
    } catch (error) {
        console.error('❌ Error reading wallets file:', error);
        return [];
    }
}

// Load proxies from file
async function loadProxies() {
    try {
        const data = await fs.readFile('proxy.txt', 'utf8');
        return data.trim().split('\n').filter(line => line.trim());
    } catch (error) {
        console.error('❌ Error reading proxies file:', error);
        return [];
    }
}

// Create Capsolver task
async function createCapsolverTask(apiKey) {
    try {
        console.log('🔄 Creating Capsolver task...');
        
        const response = await axios.post(`${CONFIG.CAPSOLVER_API_URL}/createTask`, {
            clientKey: apiKey,
            task: {
                type: 'AntiTurnstileTaskProxyLess',
                websiteURL: 'https://faucet.xion.burnt.com/',
                websiteKey: '0x4AAAAAAA5DeCW7T-bO0I0V',
                metadata: {
                    action: 'managed',
                    cdata: 'blob'
                }
            }
        });

        if (response.data.errorId === 0) {
            console.log('✅ Task created:', response.data.taskId);
            return response.data.taskId;
        } else {
            throw new Error(`Capsolver error: ${response.data.errorDescription}`);
        }
    } catch (error) {
        console.error('❌ Error creating Capsolver task:', error.message);
        throw error;
    }
}

// Get Capsolver task result
async function getCapsolverResult(apiKey, taskId) {
    try {
        console.log('⏳ Waiting for captcha solution...');
        
        let attempts = 0;
        const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
        
        while (attempts < maxAttempts) {
            const response = await axios.post(`${CONFIG.CAPSOLVER_API_URL}/getTaskResult`, {
                clientKey: apiKey,
                taskId: taskId
            });

            if (response.data.errorId === 0) {
                if (response.data.status === 'ready') {
                    console.log('✅ Captcha solved!');
                    return response.data.solution.token;
                } else if (response.data.status === 'processing') {
                    attempts++;
                    await sleep(2000); // Wait 2 seconds before next check
                } else {
                    throw new Error(`Unknown status: ${response.data.status}`);
                }
            } else {
                throw new Error(`Capsolver error: ${response.data.errorDescription}`);
            }
        }
        
        throw new Error('Timeout waiting for captcha solution');
    } catch (error) {
        console.error('❌ Error getting Capsolver result:', error.message);
        throw error;
    }
}

// Solve captcha with Capsolver
async function solveCaptcha(apiKey) {
    try {
        const taskId = await createCapsolverTask(apiKey);
        const token = await getCapsolverResult(apiKey, taskId);
        console.log('📝 Token received:', token.substring(0, 30) + '...');
        return token;
    } catch (error) {
        console.error('❌ Error solving captcha:', error);
        throw error;
    }
}

// Get session cookies
async function getSessionCookies(proxy) {
    try {
        const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;
        
        const response = await axios.get('https://faucet.xion.burnt.com/', {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            },
            validateStatus: () => true,
            maxRedirects: 5
        });
        
        // Extract cookies
        const cookies = {};
        const setCookieHeaders = response.headers['set-cookie'] || [];
        
        setCookieHeaders.forEach(cookie => {
            const parts = cookie.split(';')[0].split('=');
            if (parts.length === 2) {
                cookies[parts[0]] = parts[1];
            }
        });
        
        const cookieString = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
            
        console.log('🍪 Cookies obtained:', Object.keys(cookies).join(', '));
        return cookieString;
    } catch (error) {
        console.error('❌ Error getting session:', error.message);
        throw error;
    }
}

// Claim faucet request
async function claimFaucet(wallet, proxy, cookieString, captchaToken) {
    try {
        const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;
        
        const payload = {
            address: wallet,
            chainId: CONFIG.CHAIN_ID,
            denom: CONFIG.DENOM,
            token: captchaToken
        };
        
        console.log('📤 Sending claim request...');
        
        const headers = {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'en-GB,en;q=0.9',
            'Content-Type': 'application/json',
            'Origin': 'https://faucet.xion.burnt.com',
            'Referer': 'https://faucet.xion.burnt.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
            'Sec-CH-UA': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        };
        
        if (cookieString) {
            headers['Cookie'] = cookieString;
        }
        
        const response = await axios.post(CONFIG.FAUCET_URL, payload, {
            headers,
            httpsAgent: agent,
            timeout: 30000,
            validateStatus: () => true
        });
        
        console.log('📥 Response status:', response.status);
        
        if (response.status === 200) {
            return response.data;
        } else {
            console.error('❌ Error response:', response.data);
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        console.error('❌ Error claiming faucet:', error.message);
        throw error;
    }
}

// Process single wallet
async function processWallet(wallet, proxy, apiKey, index) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Processing wallet ${index + 1}: ${wallet}`);
    console.log(`📡 Using proxy: ${proxy || 'No proxy'}`);
    
    let retries = 0;
    while (retries < CONFIG.MAX_RETRIES) {
        try {
            // Get session cookies
            console.log('\n1️⃣ Getting session...');
            const cookieString = await getSessionCookies(proxy);
            
            // Solve captcha
            console.log('\n2️⃣ Solving captcha...');
            const captchaToken = await solveCaptcha(apiKey);
            
            // Claim faucet
            console.log('\n3️⃣ Claiming tokens...');
            const result = await claimFaucet(wallet, proxy, cookieString, captchaToken);
            
            console.log(`\n✅ Success! Wallet ${wallet}:`);
            console.log(`   💰 Amount: ${result.convertedAmount?.amount || result.amount?.amount} ${result.convertedAmount?.denom || result.amount?.denom}`);
            console.log(`   📊 Transaction Hash: ${result.transactionHash}`);
            console.log(`   📏 Block Height: ${result.height}`);
            
            return true;
        } catch (error) {
            retries++;
            console.error(`\n❌ Error on attempt ${retries}:`, error.message);
            
            if (retries < CONFIG.MAX_RETRIES) {
                console.log(`⏳ Waiting 10 seconds before retry...`);
                await sleep(10000);
            } else {
                console.error(`❌ Failed to process wallet ${wallet} after ${CONFIG.MAX_RETRIES} attempts`);
            }
        }
    }
    
    return false;
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Check Capsolver balance
async function checkCapsolverBalance(apiKey) {
    try {
        const response = await axios.post(`${CONFIG.CAPSOLVER_API_URL}/getBalance`, {
            clientKey: apiKey
        });
        
        if (response.data.errorId === 0) {
            console.log(`💳 Capsolver Balance: $${response.data.balance}`);
            if (response.data.balance < 1) {
                console.warn('⚠️  Warning: Low Capsolver balance!');
            }
        } else {
            console.error('❌ Could not check balance:', response.data.errorDescription);
        }
    } catch (error) {
        console.error('❌ Error checking balance:', error.message);
    }
}

// Main function
async function main() {
    console.log('🚀 Starting XION Faucet Bot...\n');
    console.log(`⏰ Current time: ${new Date().toLocaleString()}`);
    
    // Check API key
    const apiKey = process.env.CAPSOLVER_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: CAPSOLVER_API_KEY not found in .env file!');
        process.exit(1);
    }
    
    // Check balance
    await checkCapsolverBalance(apiKey);
    
    // Load wallets and proxies
    const wallets = await loadWallets();
    const proxies = await loadProxies();
    
    if (wallets.length === 0) {
        console.error('❌ No wallets found in xiwal.txt file!');
        process.exit(1);
    }
    
    console.log(`\n📊 Total wallets: ${wallets.length}`);
    console.log(`📊 Total proxies: ${proxies.length}`);
    
    // Process wallets
    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i].trim();
        const proxy = proxies[i % proxies.length]; // Rotate through proxies
        
        if (wallet) {
            const success = await processWallet(wallet, proxy, apiKey, i);
            
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
            
            // Show progress
            const progress = ((i + 1) / wallets.length * 100).toFixed(1);
            console.log(`\n📈 Progress: ${i + 1}/${wallets.length} (${progress}%)`);
            
            // Delay between requests
            if (i < wallets.length - 1) {
                console.log(`⏳ Waiting ${CONFIG.DELAY_BETWEEN_REQUESTS / 1000} seconds before next request...`);
                await sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
            }
        }
    }
    
    // Show final stats
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL STATISTICS:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⏱️  Total duration: ${duration} minutes`);
    console.log(`💰 Success rate: ${(successCount / wallets.length * 100).toFixed(1)}%`);
    console.log('🏁 Bot completed!');
}

// Run the bot
main().catch(console.error);


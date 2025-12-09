const nodemailer = require('nodemailer');
const readline = require('readline-sync');
const colors = require('colors');
const fs = require('fs');
const path = require('path');
let senderEmail = '';
let senderPassword = '';
let tiktokUsername = 'scammer_account';
let configSaved = false;
const RECIPIENTS = ['legal@tiktok.com', 'privacy@tiktok.com', 'report@tiktok.com'];
const SUBJECT = 'Laporan Akun Penipuan di TikTok';
function showBanner() {
    console.clear();
    console.log(colors.blue(`
[TIKTOK REPORT ]
 [by @HOZOO MD]
    `));
}
function showWarning() {
    console.log(colors.red(`
════════ PERINGATAN PENTING ════════`));
    console.log(colors.yellow(`⚠️  GUNAKAN DENGAN TANGGUNG JAWAB! ⚠️`));
    console.log(`
1. Script ini untuk tujuan pendidikan
2. Batas Gmail: ${colors.yellow('500 email/hari')}
3. Pengiriman massal = ${colors.red('SUSPENSI AKUN')}
4. ${colors.green('WAJIB pakai App Password')}
5. ${colors.yellow('WAJIB aktifkan 2-Step Verification')}
6. Pelaporan palsu adalah ${colors.red('TINDAK PIDANA')}
    `);
    console.log(colors.red(`═══════════════════════════════════════`));
    
    const confirm = readline.question('Apakah Anda memahami risiko ini? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
        console.log(colors.yellow('[!] Script dibatalkan. Hati-hati ya!'));
        process.exit(0);
    }
}

function getUserInput() {
    console.log(colors.cyan('\n════════ MASUKKAN DATA ANDA ════════'));
    
    // Input email
    while (true) {
        const email = readline.question('📧 Masukkan email Gmail Anda: ');
        
        if (!email) {
            console.log(colors.red('[!] Email tidak boleh kosong'));
            continue;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log(colors.red('[!] Format email tidak valid'));
            continue;
        }
        
        senderEmail = email;
        break;
    }
    
    // Informasi App Password
    console.log(colors.yellow('\n🔐 INFORMASI APP PASSWORD:'));
    console.log(colors.green('1. Buka: https://myaccount.google.com'));
    console.log('2. Aktifkan 2-Step Verification');
    console.log('3. Pilih "Security" → "App passwords"');
    console.log('4. Pilih "Mail" dan device "Other"');
    console.log('5. Copy password 16 karakter');
    
    // Input App Password
    while (true) {
        const password = readline.question('🔑 Masukkan App Password: ', {
            hideEchoBack: true
        });
        
        if (!password) {
            console.log(colors.red('[!] Password tidak boleh kosong'));
            continue;
        }
        
        if (password.length < 16) {
            console.log(colors.red('[!] Password terlalu pendek'));
            continue;
        }
        
        senderPassword = password;
        break;
    }
    
    // Input username target
    console.log(colors.yellow('\n🎯 MASUKKAN TARGET TIKTOK:'));
    const username = readline.question('Masukkan username TikTok (contoh: scammer123): ');
    
    if (!username) {
        tiktokUsername = 'scammer_account';
        console.log(colors.yellow(`[!] Menggunakan username default: ${tiktokUsername}`));
    } else {
        tiktokUsername = username;
    }
    
    // Konfirmasi
    console.log(colors.green('\n════════ KONFIRMASI DATA ════════'));
    console.log(`Email       : ${colors.cyan(senderEmail)}`);
    console.log(`Username    : ${colors.yellow(`@${tiktokUsername}`)}`);
    console.log(`Penerima    : ${colors.blue(RECIPIENTS.join(', '))}`);
    console.log(colors.green('══════════════════════════════════'));
    
    const confirm = readline.question('Apakah data sudah benar? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
        console.log(colors.yellow('[!] Silakan ulangi input data'));
        getUserInput();
    } else {
        configSaved = true;
        console.log(colors.green('\n[✓] Konfigurasi berhasil disimpan!'));
    }
}

function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: senderEmail,
            pass: senderPassword
        }
    });
}

function createEmailBody(username) {
    const currentDate = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    return `
Saya melaporkan akun @${username} karena melakukan praktik penipuan. Akun ini melakukan impersonasi/peniruan identitas dan mengirimkan link berbahaya untuk menipu korban. Tolong segera tinjau dan hapus akun ini untuk keamanan pengguna TikTok lainnya.

    `;
}

async function sendSingleEmail(username) {
    console.log(colors.yellow(`\n[*] Menyiapkan email untuk @${username}...`));
    
    const transporter = createTransporter();
    const emailBody = createEmailBody(username);
    
    const mailOptions = {
        from: senderEmail,
        to: RECIPIENTS.join(', '),
        subject: SUBJECT,
        text: emailBody
    };
    
    try {
        console.log(colors.yellow('[*] Mengirim ke TikTok...'));
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log(colors.green(`[✓] Email BERHASIL terkirim ke TikTok!`));
        console.log(colors.cyan(`Waktu: ${new Date().toLocaleTimeString()}`));
        console.log(colors.gray(`Message ID: ${info.messageId}`));
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.log(colors.red(`[✗] GAGAL mengirim email`));
        
        if (error.code === 'EAUTH') {
            console.log(colors.yellow('Error: Autentikasi gagal'));
            console.log('Periksa email dan App Password Anda');
        } else if (error.code === 'EENVELOPE') {
            console.log(colors.yellow('Error: Alamat email tidak valid'));
        } else if (error.message.includes('quota')) {
            console.log(colors.yellow('Error: Kuota email harian terlampaui'));
        } else {
            console.log(colors.yellow(`Error detail: ${error.message}`));
        }
        
        return { success: false, error: error.message };
    }
}

async function singleReport() {
    console.log(colors.cyan('\n════════ MODE LAPORAN TUNGGAL ════════'));
    
    let username = tiktokUsername;
    const customUser = readline.question(`Username target [${username}]: `);
    
    if (customUser.trim()) {
        username = customUser.trim();
    }
    
    await sendSingleEmail(username);
}

async function batchReport() {
    console.log(colors.magenta('\n════════ MODE LAPORAN MULTIPLE ════════'));
    
    const filePath = readline.question('📁 Masukkan path file daftar username: ');
    
    if (!fs.existsSync(filePath)) {
        console.log(colors.red(`[!] File tidak ditemukan: ${filePath}`));
        return;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const usernames = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(username => username.replace('@', ''));
    
    console.log(colors.cyan(`Total username ditemukan: ${usernames.length}`));
    
    const confirm = readline.question('Mulai pengiriman? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
        console.log(colors.yellow('[!] Dibatalkan'));
        return;
    }
    
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i];
        
        console.log(colors.blue(`\n════════ [${i + 1}/${usernames.length}] ════════`));
        console.log(colors.yellow(`Memproses: @${username}`));
        
        const result = await sendSingleEmail(username);
        
        if (result.success) {
            successCount++;
        } else {
            failedCount++;
        }
        
        // Delay untuk hindari rate limit
        if (i < usernames.length - 1) {
            console.log(colors.cyan('⏳ Menunggu 15 detik sebelum akun berikutnya...'));
            await sleep(15000);
        }
    }
    
    // Hasil akhir
    console.log(colors.green('\n════════ HASIL AKHIR ════════'));
    console.log(`📊 Total diproses : ${usernames.length}`);
    console.log(`✅ Berhasil      : ${successCount}`);
    console.log(`❌ Gagal         : ${failedCount}`);
    console.log(colors.green('════════════════════════════'));
}

async function unlimitedMode() {
    console.log(colors.red('\n════════ PERINGATAN: UNLIMITED MODE ════════'));
    console.log(colors.yellow('⚠️  MODE INI SANGAT BERBAHAYA! ⚠️'));
    console.log(`
Risiko:
1. Akun Gmail bisa DIBLOKIR PERMANEN
2. IP address bisa diblacklist
3. Melanggar Terms of Service Google
    `);
    console.log(colors.red('══════════════════════════════════════════'));
    
    const confirm = readline.question('Anda yakin ingin melanjutkan? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
        console.log(colors.green('[+] Mode unlimited dibatalkan'));
        return;
    }
    
    let targetUser = tiktokUsername;
    const customUser = readline.question(`Username target [${targetUser}]: `);
    
    if (customUser.trim()) {
        targetUser = customUser.trim();
    }
    
    console.log(colors.cyan(`Starting unlimited report for @${targetUser}...`));
    console.log(colors.yellow('Tekan Ctrl+C untuk berhenti\n'));
    
    let iteration = 1;
    
    // Setup interrupt handler
    process.on('SIGINT', () => {
        console.log(colors.yellow('\n\n[!] Unlimited mode dihentikan'));
        console.log(colors.cyan(`Total iterasi: ${iteration - 1}`));
        process.exit(0);
    });
    
    while (true) {
        console.log(colors.blue(`\n════════ ITERASI #${iteration} ════════`));
        console.log(colors.cyan(`Waktu: ${new Date().toLocaleTimeString()}`));
        
        await sendSingleEmail(targetUser);
        
        // Random delay 30-60 detik
        const delay = 30000 + Math.floor(Math.random() * 31000);
        console.log(colors.yellow(`⏳ Next iteration in ${Math.round(delay / 1000)}s...`));
        
        await sleep(delay);
        iteration++;
    }
}

async function testConnection() {
    console.log(colors.yellow('\n[*] Testing koneksi ke SMTP Gmail...'));
    
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log(colors.green('[✓] Koneksi ke Gmail BERHASIL'));
        return true;
    } catch (error) {
        console.log(colors.red('[✗] Koneksi ke Gmail GAGAL'));
        console.log(colors.yellow(`Error: ${error.message}`));
        return false;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function mainMenu() {
    while (true) {
        console.log(colors.blue('\n════════ MENU UTAMA ════════'));
        console.log(`${colors.green('[1]')} Lapor 1 akun (Single)`);
        console.log(`${colors.green('[2]')} Lapor multiple akun dari file`);
        console.log(`${colors.red('[3]')} Unlimited Mode (⚠️ BERBAHAYA)`);
        console.log(`${colors.green('[4]')} Test koneksi`);
        console.log(`${colors.green('[5]')} Ganti konfigurasi`);
        console.log(`${colors.green('[6]')} Keluar`);
        console.log(colors.blue('════════════════════════════'));
        
        const choice = readline.question('Pilihan [1-6]: ');
        
        switch (choice) {
            case '1':
                singleReport().catch(console.error);
                break;
                
            case '2':
                batchReport().catch(console.error);
                break;
                
            case '3':
                unlimitedMode().catch(console.error);
                break;
                
            case '4':
                testConnection().catch(console.error);
                break;
                
            case '5':
                getUserInput();
                break;
                
            case '6':
                console.log(colors.green('\n[+] Terima kasih! Program selesai.'));
                process.exit(0);
                
            default:
                console.log(colors.red('[!] Pilihan tidak valid'));
        }
        
        // Tunggu user menekan enter sebelum kembali ke menu
        if (choice !== '6') {
            readline.question(colors.gray('\nTekan Enter untuk kembali ke menu...'));
        }
    }
}

// ============ PROGRAM UTAMA ============
async function main() {
    showBanner();
    showWarning();
    
    // Check dependencies
    try {
        require('nodemailer');
        require('readline-sync');
        require('colors');
        console.log(colors.green('[✓] Semua dependensi tersedia'));
    } catch (error) {
        console.log(colors.red(`[!] Error: ${error.message}`));
        console.log(colors.yellow('Jalankan: npm install nodemailer readline-sync colors'));
        process.exit(1);
    }
    
    // Get user input
    getUserInput();
    
    // Show current config
    console.log(colors.cyan(`\nEmail    : ${senderEmail}`));
    console.log(colors.cyan(`Target   : @${tiktokUsername}`));
    
    // Enter main menu
    mainMenu();
}

// ============ RUN PROGRAM ============
if (require.main === module) {
    main().catch(error => {
        console.error(colors.red('Fatal Error:'), error);
        process.exit(1);
    });
}

module.exports = {
    sendSingleEmail,
    createEmailBody,
    testConnection
};

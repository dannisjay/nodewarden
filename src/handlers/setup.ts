import { Env } from '../types';
import { StorageService } from '../services/storage';
import { jsonResponse, htmlResponse, errorResponse } from '../utils/response';

// Setup page HTML (single-file, no external assets)
const setupPageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NodeWarden</title>
  <style>
    :root {
      color-scheme: light;
      --bg0: #0b0b0f;
      --bg1: #0f1020;
      --card: rgba(255, 255, 255, 0.08);
      --card2: rgba(255, 255, 255, 0.06);
      --border: rgba(255, 255, 255, 0.14);
      --text: rgba(255, 255, 255, 0.92);
      --muted: rgba(255, 255, 255, 0.62);
      --muted2: rgba(255, 255, 255, 0.52);
      --accent: #0a84ff;
      --accent2: #64d2ff;
      --danger: #ff453a;
      --ok: #32d74b;
      --shadow: 0 16px 60px rgba(0, 0, 0, 0.50);
      --radius: 18px;
      --radius2: 14px;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background:
        radial-gradient(900px 600px at 15% 10%, rgba(100, 210, 255, 0.25), transparent 60%),
        radial-gradient(900px 600px at 85% 20%, rgba(10, 132, 255, 0.22), transparent 60%),
        radial-gradient(900px 600px at 50% 90%, rgba(50, 215, 75, 0.10), transparent 60%),
        linear-gradient(180deg, var(--bg0), var(--bg1));
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .shell {
   
      width: max(500px);
    }
    @media (max-width: 860px) {
      .shell { grid-template-columns: 1fr; }
    }
    .hero {
      padding: 26px;
      border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      overflow: hidden;
      position: relative;
    }
    .hero::before {
      content: "";
      position: absolute;
      inset: -2px;
      background: radial-gradient(500px 240px at 20% 0%, rgba(100, 210, 255, 0.18), transparent 60%);
      pointer-events: none;
    }
    .top {
      display: flex;
      gap: 14px;
      align-items: center;
      margin-bottom: 14px;
    }
    .mark {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(10,132,255,0.85), rgba(100,210,255,0.55));
      border: 1px solid rgba(255,255,255,0.20);
      box-shadow: 0 10px 40px rgba(10, 132, 255, 0.30);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      letter-spacing: 1px;
      color: rgba(255,255,255,0.96);
      text-transform: uppercase;
      user-select: none;
    }
    .title {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .title h1 {
      font-size: 22px;
      margin: 0;
      letter-spacing: -0.3px;
    }
    .title p {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }
    .panel {
      padding: 22px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.06);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .panel h2 {
      font-size: 16px;
      margin: 0 0 14px 0;
      letter-spacing: -0.2px;
    }
    .message {
      display: none;
      border-radius: 14px;
      padding: 12px 12px;
      margin: 0 0 12px 0;
      font-size: 13px;
      line-height: 1.45;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.06);
    }
    .message.error {
      display: block;
      border-color: rgba(255, 69, 58, 0.40);
      background: rgba(255, 69, 58, 0.10);
      color: rgba(255, 255, 255, 0.92);
    }
    .message.success {
      display: block;
      border-color: rgba(50, 215, 75, 0.35);
      background: rgba(50, 215, 75, 0.10);
      color: rgba(255, 255, 255, 0.92);
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 540px) {
      .grid { grid-template-columns: 1fr; }
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    label {
      font-size: 12px;
      color: var(--muted);
      letter-spacing: 0.2px;
    }
    input {
      height: 42px;
      padding: 0 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(0,0,0,0.18);
      color: rgba(255,255,255,0.92);
      outline: none;
      font-size: 14px;
      transition: border-color 160ms ease, box-shadow 160ms ease;
    }
    input::placeholder { color: rgba(255,255,255,0.35); }
    input:focus {
      border-color: rgba(10, 132, 255, 0.55);
      box-shadow: 0 0 0 6px rgba(10, 132, 255, 0.12);
    }
    .hint {
      margin: 0;
      color: var(--muted2);
      font-size: 12px;
      line-height: 1.55;
    }
    .actions {
      margin-top: 12px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .primary {
      width: 100%;
      height: 44px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.18);
      background: linear-gradient(135deg, rgba(10,132,255,0.95), rgba(100,210,255,0.60));
      color: rgba(255,255,255,0.96);
      font-weight: 700;
      letter-spacing: 0.2px;
      cursor: pointer;
      transition: transform 120ms ease, filter 120ms ease;
    }
    .primary:hover { filter: brightness(1.03); }
    .primary:active { transform: translateY(1px) scale(0.99); }
    .primary:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
    }
    .sideCard {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .kv {
      border-radius: var(--radius2);
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.05);
      padding: 14px;
      margin-bottom: 10px;
    }
    .kv h3 {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: rgba(255,255,255,0.86);
    }
    .kv p {
      margin: 0;
      font-size: 12px;
      line-height: 1.55;
      color: var(--muted);
    }
    .server {
      margin-top: 10px;
      font-family: var(--mono);
      font-size: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.12);
      word-break: break-all;
      color: rgba(255,255,255,0.90);
    }
    a {
      color: rgba(100, 210, 255, 0.92);
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
    .footer {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.10);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 12px;
      color: rgba(255,255,255,0.55);
    }
    .muted { color: var(--muted); }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="panel">
      <div class="top">
        <div class="mark" aria-label="NodeWarden">NW</div>
        <div class="title">
          <h1 id="t_app">NodeWarden</h1>
          <p id="t_tag">部署在 Cloudflare Workers 上的 Bitwarden 兼容服务端（个人使用）。</p>
        </div>
      </div>

      <div style="height: 12px"></div>
      <div class="muted" id="t_intro" style="font-size: 13px; line-height: 1.7;">
        创建第一个账号完成初始化，然后用任意 Bitwarden 官方客户端登录。
      </div>

      <div style="height: 14px"></div>
      <h2 id="t_setup">初始化</h2>

      <div id="message" class="message"></div>

      <div id="setup-form">
        <form id="form" onsubmit="handleSubmit(event)">
          <div class="grid">
            <div class="field">
              <label for="name" id="t_name_label">Name</label>
              <input type="text" id="name" name="name" required placeholder="Your name">
            </div>
            <div class="field">
              <label for="email" id="t_email_label">Email</label>
              <input type="email" id="email" name="email" required placeholder="you@example.com" autocomplete="email">
            </div>
          </div>

          <div style="height: 10px"></div>
          <div class="field">
            <label for="password" id="t_pw_label">Master password</label>
            <input type="password" id="password" name="password" required minlength="12" placeholder="At least 12 characters" autocomplete="new-password">
            <p class="hint" id="t_pw_hint">Choose a strong password you can remember. The server cannot recover it.</p>
          </div>

          <div style="height: 10px"></div>
          <div class="field">
            <label for="confirmPassword" id="t_pw2_label">Confirm password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required placeholder="Confirm password" autocomplete="new-password">
          </div>

          <div class="actions">
            <button type="submit" id="submitBtn" class="primary">Create account</button>
          </div>
        </form>
      </div>

      <div id="registered-view" class="sideCard" style="display: none;">
        <div class="kv">
          <h3 id="t_done_title">Setup complete</h3>
          <p id="t_done_desc">Your server is ready. Configure your Bitwarden client with this server URL:</p>
          <div class="server" id="serverUrl"></div>
        </div>

        <div class="kv">
          <h3 id="t_important">Important</h3>
          <p id="t_limitations">
            This project is designed for a single user. You cannot add new users. Changing the master password is not supported.
            If you forget it, you must redeploy and register again.
          </p>
        </div>

        <div class="kv">
          <h3 id="t_hide_title">Hide setup page</h3>
          <p id="t_hide_desc">After hiding, this setup page will return 404 for everyone. Your vault will keep working.</p>
          <div class="actions">
            <button type="button" id="hideBtn" class="primary" onclick="disableSetupPage()">Hide setup page</button>
          </div>
        </div>
      </div>

      <div class="footer">
        <div>
          <span class="muted" id="t_by">By</span>
          <a href="https://shuai.plus" target="_blank" rel="noreferrer">shuaiplus</a>
        </div>
        <div>
          <a href="https://github.com/shuaiplus/nodewarden" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </aside>
  </div>

  <script>
    const AUTHOR = { name: 'shuaiplus', website: 'https://shuai.plus', github: 'https://github.com/shuaiplus/nodewarden' };
    let isRegistered = false;

    function isChinese() {
      const lang = (navigator.language || '').toLowerCase();
      return lang.startsWith('zh');
    }

    function t(key) {
      const zh = {
        app: 'NodeWarden',
        tag: '部署在 Cloudflare Workers 上的 Bitwarden 兼容服务端（个人使用）。',
        intro: '创建第一个账号完成初始化，然后用任意 Bitwarden 官方客户端登录。',
        by: '作者',
        setup: '初始化',
        nameLabel: '昵称',
        emailLabel: '邮箱',
        pwLabel: '主密码',
        pwHint: '请选择你能记住的强密码。服务器无法找回主密码。',
        pw2Label: '确认主密码',
        create: '创建账号',
        creating: '正在创建…',
        doneTitle: '初始化完成',
        doneDesc: '服务已就绪。在 Bitwarden 客户端中填入以下服务器地址：',
        important: '重要提示',
        limitations: '本项目仅支持单用户：不能添加新用户；不支持修改主密码；如果忘记主密码，只能重新部署并重新注册。',
        hideTitle: '隐藏初始化页',
        hideDesc: '隐藏后，初始化页对任何人都会直接返回 404。你的密码库仍可正常使用。',
        hideBtn: '隐藏初始化页',
        hideWorking: '正在隐藏…',
        hideDone: '已隐藏，此页面将返回 404。',
        hideFailed: '隐藏失败',
        hideConfirm: '确认隐藏初始化页？隐藏后页面将不可访问，但你的密码库不会受影响。',
        errPwNotMatch: '两次输入的密码不一致',
        errPwTooShort: '密码长度至少 12 位',
        errGeneric: '发生错误：',
        errRegisterFailed: '注册失败',
      };
      const en = {
        app: 'NodeWarden',
        tag: 'Minimal Bitwarden-compatible server on Cloudflare Workers (personal use).',
        intro: 'Create your first account to finish setup. Then use any official Bitwarden client to sign in.',
        by: 'By',
        setup: 'Setup',
        nameLabel: 'Name',
        emailLabel: 'Email',
        pwLabel: 'Master password',
        pwHint: 'Choose a strong password you can remember. The server cannot recover it.',
        pw2Label: 'Confirm password',
        create: 'Create account',
        creating: 'Creating…',
        doneTitle: 'Setup complete',
        doneDesc: 'Your server is ready. Configure your Bitwarden client with this server URL:',
        important: 'Important',
        limitations: 'Single user only: you cannot add new users. Changing the master password is not supported. If you forget it, redeploy and register again.',
        hideTitle: 'Hide setup page',
        hideDesc: 'After hiding, this setup page will return 404 for everyone. Your vault will keep working.',
        hideBtn: 'Hide setup page',
        hideWorking: 'Hiding…',
        hideDone: 'Hidden. This page will now return 404.',
        hideFailed: 'Failed to hide setup page',
        hideConfirm: 'Hide the setup page? It will no longer be accessible, but your vault will keep working.',
        errPwNotMatch: 'Passwords do not match',
        errPwTooShort: 'Password must be at least 12 characters',
        errGeneric: 'An error occurred: ',
        errRegisterFailed: 'Registration failed',
      };
      return (isChinese() ? zh : en)[key];
    }

    function applyI18n() {
      document.documentElement.lang = isChinese() ? 'zh-CN' : 'en';

      document.getElementById('t_app').textContent = t('app');
      document.getElementById('t_tag').textContent = t('tag');
      document.getElementById('t_intro').textContent = t('intro');
      document.getElementById('t_by').textContent = t('by');
      document.getElementById('t_setup').textContent = t('setup');

      document.getElementById('t_name_label').textContent = t('nameLabel');
      document.getElementById('t_email_label').textContent = t('emailLabel');
      document.getElementById('t_pw_label').textContent = t('pwLabel');
      document.getElementById('t_pw_hint').textContent = t('pwHint');
      document.getElementById('t_pw2_label').textContent = t('pw2Label');
      document.getElementById('submitBtn').textContent = t('create');

      document.getElementById('t_done_title').textContent = t('doneTitle');
      document.getElementById('t_done_desc').textContent = t('doneDesc');
      document.getElementById('t_important').textContent = t('important');
      document.getElementById('t_limitations').textContent = t('limitations');
      document.getElementById('t_hide_title').textContent = t('hideTitle');
      document.getElementById('t_hide_desc').textContent = t('hideDesc');
      document.getElementById('hideBtn').textContent = t('hideBtn');
    }

    // Check if already registered
    async function checkStatus() {
      try {
        const res = await fetch('/setup/status');
        const data = await res.json();
        isRegistered = !!data.registered;
        if (data.registered) {
          showRegisteredView();
        }
      } catch (e) {
        console.error('Failed to check status:', e);
      }
    }
    
    function showRegisteredView() {
      isRegistered = true;
      document.getElementById('setup-form').style.display = 'none';
      document.getElementById('registered-view').style.display = 'block';
      document.getElementById('serverUrl').textContent = window.location.origin;
  showMessage(t('doneTitle'), 'success');
      const form = document.getElementById('form');
      if (form) {
        const fields = form.querySelectorAll('input, button');
        fields.forEach((el) => {
          el.disabled = true;
        });
      }
    }

    async function disableSetupPage() {
      if (!isRegistered) return;
      if (!confirm(t('hideConfirm'))) return;

      const btn = document.getElementById('hideBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = t('hideWorking');
      }

      try {
        const res = await fetch('/setup/disable', { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.success) {
          showMessage(t('hideDone'), 'success');
          setTimeout(() => window.location.reload(), 600);
          return;
        }
        showMessage(data.error || t('hideFailed'), 'error');
      } catch (e) {
        showMessage(t('hideFailed'), 'error');
      }

      if (btn) {
        btn.disabled = false;
        btn.textContent = t('hideBtn');
      }
    }
    
    function showMessage(text, type) {
      const msg = document.getElementById('message');
      msg.textContent = text;
      msg.className = 'message ' + type;
    }
    
    // PBKDF2-SHA256 key derivation (compatible with Bitwarden)
    // password can be string or Uint8Array
    async function pbkdf2(password, salt, iterations, keyLen) {
      const encoder = new TextEncoder();
      
      // Handle password as string or Uint8Array
      const passwordBytes = (password instanceof Uint8Array) 
        ? password 
        : encoder.encode(password);
      
      // Handle salt as string or Uint8Array  
      const saltBytes = (salt instanceof Uint8Array)
        ? salt
        : encoder.encode(salt);
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        keyLen * 8
      );
      
      return new Uint8Array(derivedBits);
    }
    
    // HKDF expand
    async function hkdfExpand(prk, info, length) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        prk,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const infoBytes = encoder.encode(info);
      const result = new Uint8Array(length);
      let prev = new Uint8Array(0);
      let offset = 0;
      let counter = 1;
      
      while (offset < length) {
        const input = new Uint8Array(prev.length + infoBytes.length + 1);
        input.set(prev);
        input.set(infoBytes, prev.length);
        input[input.length - 1] = counter;
        
        const signature = await crypto.subtle.sign('HMAC', key, input);
        prev = new Uint8Array(signature);
        
        const toCopy = Math.min(prev.length, length - offset);
        result.set(prev.slice(0, toCopy), offset);
        offset += toCopy;
        counter++;
      }
      
      return result;
    }
    
    // Generate symmetric key
    function generateSymmetricKey() {
      return crypto.getRandomValues(new Uint8Array(64));
    }
    
    // Encrypt with AES-256-CBC
    async function encryptAesCbc(data, key, iv) {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-CBC' },
        false,
        ['encrypt']
      );
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: iv },
        cryptoKey,
        data
      );
      
      return new Uint8Array(encrypted);
    }
    
    // HMAC-SHA256
    async function hmacSha256(key, data) {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
      return new Uint8Array(signature);
    }
    
    // Base64 encode
    function base64Encode(bytes) {
      return btoa(String.fromCharCode.apply(null, bytes));
    }
    
    // Create encrypted string in Bitwarden format
    async function encryptToBitwardenFormat(data, encKey, macKey) {
      const iv = crypto.getRandomValues(new Uint8Array(16));
      const encrypted = await encryptAesCbc(data, encKey, iv);
      
      // Calculate MAC over IV + encrypted data
      const macData = new Uint8Array(iv.length + encrypted.length);
      macData.set(iv);
      macData.set(encrypted, iv.length);
      const mac = await hmacSha256(macKey, macData);
      
      // Format: 2.{base64(iv)}|{base64(encrypted)}|{base64(mac)}
      return '2.' + base64Encode(iv) + '|' + base64Encode(encrypted) + '|' + base64Encode(mac);
    }
    
    // Generate RSA key pair
    async function generateRsaKeyPair() {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-1'
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Export public key
      const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyB64 = base64Encode(new Uint8Array(publicKeySpki));
      
      // Export private key
      const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKeyBytes = new Uint8Array(privateKeyPkcs8);
      
      return {
        publicKey: publicKeyB64,
        privateKey: privateKeyBytes
      };
    }
    
    async function handleSubmit(event) {
      event.preventDefault();

      if (isRegistered) {
        showMessage(t('doneTitle'), 'success');
        return;
      }
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value.toLowerCase();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (password !== confirmPassword) {
  showMessage(t('errPwNotMatch'), 'error');
        return;
      }
      
      if (password.length < 12) {
  showMessage(t('errPwTooShort'), 'error');
        return;
      }
      
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
  btn.textContent = t('creating');
      
      try {
        // Generate master key using PBKDF2 (Bitwarden default: 600000 iterations)
        const iterations = 600000;
        const masterKey = await pbkdf2(password, email, iterations, 32);
        
        // Generate master password hash (for authentication)
        // Bitwarden: PBKDF2(masterKey as raw bytes, password, 1 iteration)
        const masterPasswordHash = await pbkdf2(masterKey, password, 1, 32);
        const masterPasswordHashB64 = base64Encode(masterPasswordHash);
        
        // Stretch master key using HKDF
        const stretchedKey = await hkdfExpand(masterKey, 'enc', 32);
        const stretchedMacKey = await hkdfExpand(masterKey, 'mac', 32);
        
        // Generate symmetric key (will be encrypted with stretched master key)
        const symmetricKey = generateSymmetricKey();
        
        // Encrypt symmetric key with stretched master key
        const encryptedKey = await encryptToBitwardenFormat(symmetricKey, stretchedKey, stretchedMacKey);
        
        // Generate RSA key pair
        const rsaKeys = await generateRsaKeyPair();
        
        // Encrypt private key with symmetric key
        const encryptedPrivateKey = await encryptToBitwardenFormat(rsaKeys.privateKey, symmetricKey.slice(0, 32), symmetricKey.slice(32, 64));
        
        // Register with server
        const response = await fetch('/api/accounts/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            name: name,
            masterPasswordHash: masterPasswordHashB64,
            key: encryptedKey,
            kdf: 0,
            kdfIterations: iterations,
            keys: {
              publicKey: rsaKeys.publicKey,
              encryptedPrivateKey: encryptedPrivateKey
            }
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          showRegisteredView();
        } else {
          showMessage(result.error || result.ErrorModel?.Message || t('errRegisterFailed'), 'error');
          btn.disabled = false;
          btn.textContent = t('create');
        }
      } catch (error) {
        console.error('Registration error:', error);
        showMessage(t('errGeneric') + (error && error.message ? error.message : String(error)), 'error');
        btn.disabled = false;
        btn.textContent = t('create');
      }
    }
    
    // Check status on page load
    applyI18n();
    checkStatus();
  </script>
</body>
</html>`;

// GET / - Setup page
export async function handleSetupPage(request: Request, env: Env): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const disabled = await storage.isSetupDisabled();
  if (disabled) {
    return new Response(null, { status: 404 });
  }
  return htmlResponse(setupPageHTML);
}

// GET /setup/status
export async function handleSetupStatus(request: Request, env: Env): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const registered = await storage.isRegistered();
  const disabled = await storage.isSetupDisabled();
  return jsonResponse({ registered, disabled });
}

// POST /setup/disable
export async function handleDisableSetup(request: Request, env: Env): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const registered = await storage.isRegistered();
  if (!registered) {
    return errorResponse('Registration required', 403);
  }
  await storage.setSetupDisabled();
  return jsonResponse({ success: true });
}

// Global Variables
let selectedPackage = null;
let selectedPrice = 0;
let orderData = {};

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8108644157:AAEXkBtTSxv2iWXYiBmNxnHSoz_f1ch87wM';
const TELEGRAM_CHAT_ID = '8084861068';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Loading Animation
document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContent = document.getElementById('mainContent');
    const loadingProgress = document.querySelector('.loading-progress');
    const loadingPercentage = document.querySelector('.loading-percentage');
    
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        loadingProgress.style.width = progress + '%';
        loadingPercentage.textContent = Math.floor(progress) + '%';
        
        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    mainContent.classList.add('show');
                }, 500);
            }, 500);
        }
    }, 100);
});

// Smooth Scrolling
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Navigation
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Update active nav link
            navLinks.forEach(nl => nl.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Scroll spy
    window.addEventListener('scroll', function() {
        const sections = ['home', 'packages', 'features', 'order'];
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            const navLink = document.querySelector(`[href="#${sectionId}"]`);
            
            if (section && navLink) {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    navLinks.forEach(nl => nl.classList.remove('active'));
                    navLink.classList.add('active');
                }
            }
        });
    });
});

// Package Selection
function selectPackage(packageType, price) {
    selectedPackage = packageType;
    selectedPrice = price;
    
    // Update form
    document.getElementById('selectedPackage').value = packageType.charAt(0).toUpperCase() + packageType.slice(1);
    document.getElementById('totalPrice').value = `Rp ${price.toLocaleString('id-ID')}`;
    
    // Enable process order button
    const processBtn = document.getElementById('processOrder');
    processBtn.disabled = false;
    
    // Highlight selected package
    document.querySelectorAll('.package-card').forEach(card => {
        card.style.transform = '';
        card.style.boxShadow = '';
    });
    
    const selectedCard = document.querySelector(`[data-package="${packageType}"]`);
    if (selectedCard) {
        selectedCard.style.transform = 'translateY(-10px) scale(1.02)';
        selectedCard.style.boxShadow = '0 25px 50px rgba(0, 245, 255, 0.3)';
    }
    
    // Scroll to order form
    scrollToSection('order');
    
    // Show success notification
    showNotification('Paket berhasil dipilih!', 'success');
}

// Process Order
document.addEventListener('DOMContentLoaded', function() {
    const processOrderBtn = document.getElementById('processOrder');
    const paymentContainer = document.getElementById('paymentContainer');
    
    processOrderBtn.addEventListener('click', function() {
        const buyerName = document.getElementById('buyerName').value.trim();
        const buyerTelegram = document.getElementById('buyerTelegram').value.trim();
        
        if (!buyerName || !buyerTelegram) {
            showNotification('Harap lengkapi semua data!', 'error');
            return;
        }
        
        if (!buyerTelegram.startsWith('@')) {
            showNotification('Username Telegram harus diawali dengan @', 'error');
            return;
        }
        
        // Store order data
        orderData = {
            package: selectedPackage,
            price: selectedPrice,
            buyerName: buyerName,
            buyerTelegram: buyerTelegram,
            orderTime: new Date().toLocaleString('id-ID')
        };
        
        // Show payment container
        paymentContainer.style.display = 'block';
        paymentContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Send order notification to Telegram
        sendOrderNotification();
        
        showNotification('Pesanan diproses! Silakan lakukan pembayaran.', 'success');
    });
});

// Copy Text Function
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Nomor berhasil disalin!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Nomor berhasil disalin!', 'success');
    });
}

// File Upload Handler
function handleFileUpload(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const confirmBtn = document.getElementById('confirmPayment');
    
    if (file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
                confirmBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            showNotification('Harap pilih file gambar!', 'error');
            event.target.value = '';
        }
    }
}

// Remove Preview
function removePreview() {
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('paymentProof').value = '';
    document.getElementById('confirmPayment').disabled = true;
}

// Confirm Payment
document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('confirmPayment');
    
    confirmBtn.addEventListener('click', function() {
        const fileInput = document.getElementById('paymentProof');
        const file = fileInput.files[0];
        
        if (!file) {
            showNotification('Harap pilih bukti transfer!', 'error');
            return;
        }
        
        // Send payment proof to Telegram
        sendPaymentProof(file);
    });
});

// Send Order Notification to Telegram
async function sendOrderNotification() {
    const message = `
🔥 *PESANAN BARU SCRIPT ALWAYSZAKZZ V9* 🔥

📦 *Detail Pesanan:*
• Paket: ${orderData.package.toUpperCase()}
• Harga: Rp ${orderData.price.toLocaleString('id-ID')}
• Nama: ${orderData.buyerName}
• Telegram: ${orderData.buyerTelegram}
• Waktu: ${orderData.orderTime}

⏳ *Status:* Menunggu pembayaran
💰 *Pembayaran via:* DANA/QRIS

*Buyer sedang melakukan pembayaran...*
    `;
    
    try {
        await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (error) {
        console.error('Error sending order notification:', error);
    }
}

// Send Payment Proof to Telegram
async function sendPaymentProof(file) {
    try {
        // Show loading
        const confirmBtn = document.getElementById('confirmPayment');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        confirmBtn.disabled = true;
        
        // Create form data
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CHAT_ID);
        formData.append('photo', file);
        
        const caption = `
💸 *BUKTI TRANSFER DITERIMA* 💸

📦 *Detail Pesanan:*
• Paket: ${orderData.package.toUpperCase()}
• Harga: Rp ${orderData.price.toLocaleString('id-ID')}
• Nama: ${orderData.buyerName}
• Telegram: ${orderData.buyerTelegram}
• Waktu: ${orderData.orderTime}

✅ *Status:* Pembayaran dikonfirmasi
📱 *Bukti:* Terlampir

*Silakan proses pengiriman script ke buyer!*

🔗 *Link Grup WhatsApp untuk Buyer:*
https://chat.whatsapp.com/G9Dd9DdVfOX18zCzK5KmAB

*Script AlwaysZakzz V9 siap dikirim!*
        `;
        
        formData.append('caption', caption);
        formData.append('parse_mode', 'Markdown');
        
        const response = await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            // Show success modal
            document.getElementById('successModal').style.display = 'block';
            showNotification('Bukti transfer berhasil dikirim!', 'success');
        } else {
            throw new Error('Failed to send photo');
        }
    } catch (error) {
        console.error('Error sending payment proof:', error);
        showNotification('Gagal mengirim bukti transfer. Coba lagi!', 'error');
        
        // Reset button
        const confirmBtn = document.getElementById('confirmPayment');
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

// Close Modal
function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
        border: 2px solid ${getNotificationBorder(type)};
        max-width: 400px;
        backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-triangle';
        case 'warning': return 'fa-exclamation-circle';
        default: return 'fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return 'linear-gradient(45deg, #00ff00, #00cc88)';
        case 'error': return 'linear-gradient(45deg, #ff4757, #ff6b6b)';
        case 'warning': return 'linear-gradient(45deg, #ffa502, #ff7675)';
        default: return 'linear-gradient(45deg, #00f5ff, #ff00ff)';
    }
}

function getNotificationBorder(type) {
    switch (type) {
        case 'success': return '#00ff00';
        case 'error': return '#ff4757';
        case 'warning': return '#ffa502';
        default: return '#00f5ff';
    }
}

// Add notification animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px;
        margin-left: auto;
        border-radius: 5px;
        transition: background 0.3s ease;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(notificationStyles);

// Auto-send WhatsApp group link after successful payment
function autoSendWhatsAppLink() {
    const whatsappMessage = `
🎉 *SELAMAT DATANG DI ALWAYSZAKZZ V9!* 🎉

Halo ${orderData.buyerName}! 👋

Terima kasih telah mempercayai AlwaysZakzz V9!
Pembayaran Anda telah dikonfirmasi ✅

📦 *Detail Pesanan Anda:*
• Paket: ${orderData.package.toUpperCase()}
• Harga: Rp ${orderData.price.toLocaleString('id-ID')}
• Status: LUNAS ✅

🔗 *Silakan bergabung ke grup WhatsApp untuk mendapatkan script:*
https://chat.whatsapp.com/G9Dd9DdVfOX18zCzK5KmAB

📝 *Yang akan Anda dapatkan:*
✦ Script AlwaysZakzz V9 Full Working
✦ Database & Password
✦ Tutorial lengkap
✦ Support grup 24/7
✦ Update permanen

🚀 *Selamat berbisnis dengan AlwaysZakzz V9!*

*Salam sukses,*
*Team AlwaysZakzz* 🔥
    `;
    
    // Send to Telegram
    sendTelegramMessage(whatsappMessage);
}

// Send Telegram Message
async function sendTelegramMessage(message) {
    try {
        await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}

// Enhanced Package Selection with Animation
function enhancePackageSelection() {
    const packageCards = document.querySelectorAll('.package-card');
    
    packageCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'translateY(0) scale(1)';
            }
        });
        
        card.addEventListener('click', function() {
            const packageType = this.getAttribute('data-package');
            const packagePrice = getPackagePrice(packageType);
            selectPackage(packageType, packagePrice);
        });
    });
}

// Get Package Price
function getPackagePrice(packageType) {
    const prices = {
        'seller': 30000,
        'owner': 40000,
        'partner': 60000,
        'moderator': 85000
    };
    return prices[packageType] || 0;
}

// Initialize Enhanced Features
document.addEventListener('DOMContentLoaded', function() {
    enhancePackageSelection();
    
    // Add floating action buttons
    createFloatingButtons();
    
    // Add scroll-to-top button
    createScrollToTopButton();
    
    // Initialize AOS-like animations
    initScrollAnimations();
});

// Floating Action Buttons
function createFloatingButtons() {
    const fabContainer = document.createElement('div');
    fabContainer.className = 'fab-container';
    fabContainer.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 30px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;
    
    // Telegram FAB
    const telegramFab = document.createElement('a');
    telegramFab.href = 'https://t.me/AlwaysZakzz';
    telegramFab.target = '_blank';
    telegramFab.className = 'fab telegram-fab';
    telegramFab.innerHTML = '<i class="fab fa-telegram"></i>';
    telegramFab.title = 'Chat Telegram';
    
    // WhatsApp FAB
    const whatsappFab = document.createElement('a');
    whatsappFab.href = 'https://chat.whatsapp.com/G9Dd9DdVfOX18zCzK5KmAB';
    whatsappFab.target = '_blank';
    whatsappFab.className = 'fab whatsapp-fab';
    whatsappFab.innerHTML = '<i class="fab fa-whatsapp"></i>';
    whatsappFab.title = 'Grup WhatsApp';
    
    fabContainer.appendChild(telegramFab);
    fabContainer.appendChild(whatsappFab);
    document.body.appendChild(fabContainer);
    
    // Add FAB styles
    const fabStyles = document.createElement('style');
    fabStyles.textContent = `
        .fab {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: white;
            font-size: 1.5rem;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .fab::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 50%;
            transition: transform 0.3s ease;
            z-index: -1;
        }
        
        .telegram-fab {
            background: linear-gradient(45deg, #0088cc, #00aaff);
        }
        
        .whatsapp-fab {
            background: linear-gradient(45deg, #25d366, #128c7e);
        }
        
        .fab:hover {
            transform: translateY(-3px) scale(1.1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
        
        .fab:hover::before {
            transform: scale(1.2);
        }
    `;
    document.head.appendChild(fabStyles);
}

// Scroll to Top Button
function createScrollToTopButton() {
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(45deg, #00f5ff, #ff00ff);
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(scrollBtn);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.style.opacity = '1';
            scrollBtn.style.visibility = 'visible';
        } else {
            scrollBtn.style.opacity = '0';
            scrollBtn.style.visibility = 'hidden';
        }
    });
    
    // Scroll to top functionality
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    scrollBtn.addEventListener('mouseenter', () => {
        scrollBtn.style.transform = 'translateY(-3px) scale(1.1)';
        scrollBtn.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
    });
    
    scrollBtn.addEventListener('mouseleave', () => {
        scrollBtn.style.transform = 'translateY(0) scale(1)';
        scrollBtn.style.boxShadow = '0 5px 20px rgba(0,0,0,0.3)';
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements
    const animateElements = document.querySelectorAll('.package-card, .feature-card, .hero-content');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Generate Invoice ID
function generateInvoiceId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `AZ${timestamp}${random}`;
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Enhanced Order Processing
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('orderForm');
    
    // Real-time validation
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('input', validateForm);
        input.addEventListener('blur', validateField);
    });
    
    function validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        
        // Remove previous error styling
        field.style.borderColor = '';
        
        if (!value) {
            field.style.borderColor = '#ff4757';
            return false;
        }
        
        if (field.id === 'buyerTelegram' && !value.startsWith('@')) {
            field.style.borderColor = '#ff4757';
            showNotification('Username Telegram harus diawali dengan @', 'warning');
            return false;
        }
        
        field.style.borderColor = '#00ff00';
        return true;
    }
    
    function validateForm() {
        const buyerName = document.getElementById('buyerName').value.trim();
        const buyerTelegram = document.getElementById('buyerTelegram').value.trim();
        const processBtn = document.getElementById('processOrder');
        
        const isValid = buyerName && 
                       buyerTelegram && 
                       buyerTelegram.startsWith('@') && 
                       selectedPackage;
        
        processBtn.disabled = !isValid;
    }
});

// Error Handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    showNotification('Terjadi kesalahan. Silakan refresh halaman.', 'error');
});

// Network Status
window.addEventListener('online', function() {
    showNotification('Koneksi internet tersambung kembali!', 'success');
});

window.addEventListener('offline', function() {
    showNotification('Koneksi internet terputus!', 'warning');
});

// Performance Monitoring
const startTime = performance.now();
window.addEventListener('load', function() {
    const loadTime = performance.now() - startTime;
    console.log(`Page loaded in ${Math.round(loadTime)} milliseconds`);
});

// Analytics (Simple)
function trackEvent(eventName, eventData = {}) {
    console.log(`Event: ${eventName}`, eventData);
    // Here you can integrate with analytics services like Google Analytics
}

// Track important events
document.addEventListener('DOMContentLoaded', function() {
    trackEvent('page_loaded');
    
    // Track package selections
    document.querySelectorAll('.package-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const packageName = this.closest('.package-card').getAttribute('data-package');
            trackEvent('package_selected', { package: packageName });
        });
    });
    
    // Track form submissions
    document.getElementById('processOrder').addEventListener('click', function() {
        trackEvent('order_initiated', { package: selectedPackage, price: selectedPrice });
    });
});

console.log('🔥 AlwaysZakzz V9 Website Script Loaded Successfully! 🔥');
console.log('Created by: kiryzzofficiall');
console.log('Website: AlwaysZakzz Script Store');
class BookMenu {
    constructor() {
        this.currentPage = 0;
        this.pages = document.querySelectorAll('.page');
        this.totalPages = this.pages.length;
        this.container = document.getElementById('bookContainer');
        this.isScrolling = false;
        this.scrollTimeout = null;
        
        this.init();
    }
    
    init() {
        this.setupNavigation();
        this.setupScrollEvents();
        this.setupKeyboardEvents();
        this.setupScrollToTop();
        this.loadImages();
        this.updateCurrentPage();
    }
    
    setupNavigation() {
        // Navigation dots
        const navDots = document.getElementById('navDots');
        this.pages.forEach((page, index) => {
            const dot = document.createElement('div');
            dot.className = 'nav-dot';
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.scrollToPage(index));
            navDots.appendChild(dot);
        });
    }
    
    setupScrollEvents() {
        // ใช้ Intersection Observer เพื่อตรวจจับหน้าปัจจุบัน
        const observerOptions = {
            root: this.container,
            rootMargin: '-30% 0px -30% 0px',
            threshold: [0, 0.5, 1]
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    const pageIndex = parseInt(entry.target.dataset.page);
                    if (pageIndex !== this.currentPage) {
                        this.currentPage = pageIndex;
                        this.updateNavigationDots();
                        this.preloadAdjacentPages();
                    }
                }
            });
        }, observerOptions);
        
        this.pages.forEach(page => {
            observer.observe(page);
        });
        
        // ตรวจจับการ scroll เพื่อแสดง/ซ่อนปุ่มกลับไปบนสุด
        let ticking = false;
        this.container.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateScrollToTopButton();
                    this.updateCurrentPage();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }
    
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (this.isScrolling) return;
            
            if (e.key === 'ArrowDown' || e.key === 'PageDown') {
                e.preventDefault();
                this.nextPage();
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                this.prevPage();
            } else if (e.key === 'Home') {
                e.preventDefault();
                this.scrollToPage(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                this.scrollToPage(this.totalPages - 1);
            }
        });
    }
    
    setupScrollToTop() {
        const scrollToTopBtn = document.getElementById('scrollToTopBtn');
        scrollToTopBtn.addEventListener('click', () => {
            this.scrollToPage(0);
        });
    }
    
    scrollToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.totalPages) return;
        if (this.isScrolling) return;
        
        this.isScrolling = true;
        const targetPage = this.pages[pageIndex];
        
        // ใช้ scrollTo แทน scrollIntoView เพื่อควบคุมได้ดีกว่า
        const targetPosition = targetPage.offsetTop;
        
        this.container.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // รีเซ็ต flag หลังจาก scroll เสร็จ
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 1000);
        
        this.currentPage = pageIndex;
        this.updateNavigationDots();
        this.preloadAdjacentPages();
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.scrollToPage(this.currentPage + 1);
        }
    }
    
    prevPage() {
        if (this.currentPage > 0) {
            this.scrollToPage(this.currentPage - 1);
        }
    }
    
    updateCurrentPage() {
        // อัพเดทหน้าปัจจุบันตามตำแหน่ง scroll (backup method)
        if (this.isScrolling) return;
        
        const scrollTop = this.container.scrollTop;
        const viewportHeight = this.container.clientHeight;
        const currentScrollPosition = scrollTop + viewportHeight / 2;
        
        let newCurrentPage = 0;
        let minDistance = Infinity;
        
        this.pages.forEach((page, index) => {
            const pageTop = page.offsetTop;
            const pageCenter = pageTop + page.offsetHeight / 2;
            const distance = Math.abs(currentScrollPosition - pageCenter);
            
            if (distance < minDistance) {
                minDistance = distance;
                newCurrentPage = index;
            }
        });
        
        if (newCurrentPage !== this.currentPage) {
            this.currentPage = newCurrentPage;
            this.updateNavigationDots();
        }
    }
    
    updateNavigationDots() {
        const dots = document.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentPage) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    updateScrollToTopButton() {
        const scrollToTopBtn = document.getElementById('scrollToTopBtn');
        const scrollTop = this.container.scrollTop;
        
        // แสดงปุ่มเมื่อ scroll ลงมาเกิน 300px
        if (scrollTop > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    }
    
    loadImages() {
        const images = document.querySelectorAll('.page-content img');
        images.forEach((img) => {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
                img.addEventListener('error', () => {
                    img.alt = 'ไม่สามารถโหลดรูปภาพได้';
                    img.classList.add('loaded');
                });
            }
        });
        
        // Preload หน้าถัดไป
        this.preloadAdjacentPages();
    }
    
    preloadAdjacentPages() {
        // Preload หน้าถัดไปและหน้าก่อน
        const nextIndex = this.currentPage + 1;
        const prevIndex = this.currentPage - 1;
        
        if (nextIndex < this.totalPages) {
            const nextImg = this.pages[nextIndex].querySelector('img');
            if (nextImg && nextImg.loading === 'lazy') {
                // Force load next image
                const tempImg = new Image();
                tempImg.src = nextImg.src;
            }
        }
        
        if (prevIndex >= 0) {
            const prevImg = this.pages[prevIndex].querySelector('img');
            if (prevImg && prevImg.loading === 'lazy') {
                // Force load prev image
                const tempImg = new Image();
                tempImg.src = prevImg.src;
            }
        }
    }
}

// เริ่มต้นเมื่อ DOM พร้อม
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new BookMenu();
    });
} else {
    new BookMenu();
}

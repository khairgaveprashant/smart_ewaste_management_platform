/**
 * E-Cycle — app.js
 * Homepage interactions:
 * - Navbar scroll state
 * - Mobile menu toggle & keyboard accessibility
 * - Smooth anchor scrolling with sticky header offset
 * - Active navigation link observer
 * - Circular economy interactive diagram & pathway synchronization
 * - Scroll entrance animations via IntersectionObserver
 * - Dynamic copyright year
 */

(function () {
    'use strict';

    // ── DOM References ──
    const navbar      = document.getElementById('navbar');
    const menuToggle  = document.getElementById('menuToggle');
    const mobileMenu  = document.getElementById('mobileMenu');
    const navLinks    = document.querySelectorAll('.nav-link');
    const yearSpan    = document.getElementById('currentYear');

    // ── Dynamic Copyright Year ──
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ── Navbar Scroll Shadow ──
    function handleNavbarScroll() {
        if (!navbar) return;
        if (window.scrollY > 15) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll();

    // ── Mobile Menu Toggle & Accessibility ──
    if (menuToggle && mobileMenu) {
        function toggleMobileMenu() {
            const isOpen = mobileMenu.classList.toggle('open');
            menuToggle.classList.toggle('active', isOpen);
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }

        function closeMobileMenu() {
            mobileMenu.classList.remove('open');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-label', 'Open menu');
            document.body.style.overflow = '';
        }

        menuToggle.addEventListener('click', toggleMobileMenu);

        // Close mobile menu when any item is clicked
        mobileMenu.querySelectorAll('a, button').forEach(function (link) {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
                closeMobileMenu();
                menuToggle.focus();
            }
        });
    }

    // ── Smooth Scroll for Anchor Links ──
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = navbar ? navbar.offsetHeight : 0;
                const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
                window.scrollTo({
                    top: Math.max(0, targetPos),
                    behavior: 'smooth'
                });

                // Update browser history without jump
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                }
            }
        });
    });

    // ── Active Navigation State on Scroll ──
    const trackedSections = document.querySelectorAll('header[id], section[id], footer[id]');
    function updateActiveNav() {
        if (!trackedSections.length) return;
        const scrollPosition = window.scrollY + (navbar ? navbar.offsetHeight : 60) + 60;
        let currentId = '';

        trackedSections.forEach(function (sec) {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
                currentId = sec.getAttribute('id');
            }
        });

        if (currentId) {
            navLinks.forEach(function (link) {
                const href = link.getAttribute('href');
                if (href === '#' + currentId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    }
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();

    // ── Circular Economy Interactive Diagram ──
    const ceNodes = document.querySelectorAll('.ce-node');
    const ceCards = document.querySelectorAll('.ce-pathway-card');

    function setActivePathway(pathwayNumber) {
        ceNodes.forEach(function (node) {
            const nodePathway = node.getAttribute('data-pathway');
            if (nodePathway === pathwayNumber) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });

        ceCards.forEach(function (card) {
            const cardPathway = card.getAttribute('data-pathway');
            if (cardPathway === pathwayNumber) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    ceNodes.forEach(function (node) {
        node.addEventListener('click', function () {
            const pathway = this.getAttribute('data-pathway');
            if (pathway) setActivePathway(pathway);
        });
        node.addEventListener('mouseenter', function () {
            const pathway = this.getAttribute('data-pathway');
            if (pathway) setActivePathway(pathway);
        });
    });

    ceCards.forEach(function (card) {
        card.addEventListener('click', function () {
            const pathway = this.getAttribute('data-pathway');
            if (pathway) setActivePathway(pathway);
        });
        card.addEventListener('mouseenter', function () {
            const pathway = this.getAttribute('data-pathway');
            if (pathway) setActivePathway(pathway);
        });
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const pathway = this.getAttribute('data-pathway');
                if (pathway) setActivePathway(pathway);
            }
        });
    });

    // ── Reveal on Scroll (Intersection Observer) ──
    if ('IntersectionObserver' in window) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -40px 0px'
            };

            const revealObserver = new IntersectionObserver(function (entries, observer) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
                revealObserver.observe(el);
            });
        } else {
            // Immediately reveal if user prefers reduced motion
            document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
                el.classList.add('revealed');
            });
        }
    }

})();

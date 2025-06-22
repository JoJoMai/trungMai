document.addEventListener('DOMContentLoaded', () => {

    // --- MATRIX RAIN EFFECT ---
    const canvas = document.getElementById('matrixCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const characters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン01';
    const characterArray = characters.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }
    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff41';
        ctx.font = fontSize + 'px Share Tech Mono, monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = characterArray[Math.floor(Math.random() * characterArray.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    const matrixInterval = setInterval(drawMatrix, 33);
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // --- STATE MANAGEMENT ---
    let highestZIndex = 1002;
    const windowStates = {
        portfolioWindow: { minimized: false, maximized: false, closed: false, originalState: null },
        terminalWindow: { minimized: false, maximized: false, closed: false, originalState: null }
    };

    // --- CORE UI INTERACTIONS ---
    document.addEventListener('click', handleAppClick);
    function handleAppClick(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const windowId = target.dataset.window;
        const appId = target.dataset.app;
        if (['minimize', 'maximize', 'close'].includes(action)) {
            const windowEl = document.getElementById(windowId);
            if (action === 'minimize') minimizeWindow(windowEl);
            if (action === 'maximize') maximizeWindow(windowEl);
            if (action === 'close') closeWindow(windowEl);
        }
        if (action === 'toggle') {
             const windowEl = document.getElementById(windowId);
             toggleWindow(windowEl);
        }
        if (action === 'open') {
            openApplication(appId);
        }
    }

    const startButton = document.getElementById('startButton');
    const startMenu = document.getElementById('startMenu');
    startButton.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
            startMenu.classList.remove('active');
        }
    });

    // --- WINDOW MANAGEMENT ---
    function minimizeWindow(windowEl) {
        const windowId = windowEl.id;
        const taskbarApp = document.getElementById(windowId.replace('Window', 'Task'));
        windowEl.classList.add('minimized');
        taskbarApp.classList.add('minimized');
        taskbarApp.classList.remove('active');
        windowStates[windowId].minimized = true;
        updateActiveWindow();
    }

    function maximizeWindow(windowEl) {
        const windowId = windowEl.id;
        const state = windowStates[windowId];
        const button = windowEl.querySelector('.maximize');
        if (state.maximized) {
            windowEl.classList.remove('maximized');
            if (state.originalState) {
                windowEl.style.top = state.originalState.top;
                windowEl.style.left = state.originalState.left;
                windowEl.style.width = state.originalState.width;
                windowEl.style.height = state.originalState.height;
            }
            state.maximized = false;
            button.textContent = '□';
        } else {
            state.originalState = {
                top: windowEl.style.top || windowEl.offsetTop + 'px',
                left: windowEl.style.left || windowEl.offsetLeft + 'px',
                width: windowEl.style.width || windowEl.offsetWidth + 'px',
                height: windowEl.style.height || windowEl.offsetHeight + 'px'
            };
            windowEl.classList.add('maximized');
            state.maximized = true;
            button.textContent = '⧉';
        }
         focusWindow(windowEl);
    }

    function closeWindow(windowEl) {
        const windowId = windowEl.id;
        const taskbarApp = document.getElementById(windowId.replace('Window', 'Task'));
        windowEl.style.display = 'none';
        taskbarApp.style.display = 'none';
        windowStates[windowId].closed = true;
        updateActiveWindow();
    }

    function toggleWindow(windowEl) {
        if (windowEl.classList.contains('minimized') || windowStates[windowEl.id].closed) {
            openApplication(windowEl.dataset.appId);
        } else {
            const activeWindow = getActiveWindow();
            if (activeWindow && activeWindow.id === windowEl.id) {
                minimizeWindow(windowEl);
            } else {
                focusWindow(windowEl);
            }
        }
    }

     function focusWindow(windowEl) {
         if (!windowEl || windowStates[windowEl.id].closed) return;
         highestZIndex++;
         windowEl.style.zIndex = highestZIndex;
         document.querySelectorAll('.taskbar-app').forEach(app => app.classList.remove('active'));
         const taskbarApp = document.getElementById(windowEl.id.replace('Window', 'Task'));
         if (taskbarApp) {
              taskbarApp.classList.remove('minimized');
              if(!windowEl.classList.contains('minimized')) {
                   taskbarApp.classList.add('active');
              }
         }
         if(windowEl.id === 'terminalWindow') {
             const commandInput = document.getElementById('commandInput');
             if (commandInput) {
                 setTimeout(() => commandInput.focus(), 100);
             }
         }
     }
    
     function updateActiveWindow() {
         const activeWindow = getActiveWindow();
         if (activeWindow) {
             focusWindow(activeWindow);
         } else {
              document.querySelectorAll('.taskbar-app').forEach(app => app.classList.remove('active'));
         }
     }

     function getActiveWindow() {
         let topWindow = null;
         let maxZ = 0;
         document.querySelectorAll('.window:not(.minimized)').forEach(win => {
             if (win.style.display !== 'none') {
                 const z = parseInt(win.style.zIndex) || 0;
                 if (z > maxZ) {
                     maxZ = z;
                     topWindow = win;
                 }
             }
         });
         return topWindow;
     }

    document.querySelectorAll('.window').forEach(windowEl => {
        const header = windowEl.querySelector('.window-header');
        dragElement(windowEl, header);
        windowEl.addEventListener('mousedown', () => focusWindow(windowEl));
    });

    function dragElement(elmnt, header) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        header.onmousedown = dragMouseDown;
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        function elementDrag(e) {
            if (elmnt.classList.contains('maximized')) return;
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function openApplication(appId) {
        startMenu.classList.remove('active');
        switch(appId) {
            case 'portfolio':
            case 'terminal':
                const windowId = appId + 'Window';
                const windowEl = document.getElementById(windowId);
                const taskbarApp = document.getElementById(appId + 'Task');
                windowEl.style.display = 'block';
                taskbarApp.style.display = 'flex';
                windowEl.classList.remove('minimized');
                windowStates[windowId].closed = false;
                windowStates[windowId].minimized = false;
                focusWindow(windowEl);
                break;
        }
    }

    const clockEl = document.getElementById('clock');
    function updateClock() {
        clockEl.textContent = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- TERMINAL ---
    const terminalContent = document.getElementById('terminalContent');
    const terminalOutput = document.getElementById('terminalOutput');
    const commandInput = document.getElementById('commandInput');
    const terminalInputLine = document.getElementById('terminalInputLine');
    let commandHistory = [];
    let historyIndex = -1;

    const PROMPT = 'Trung-MBP:~ trungmai$ ';
    
    // Set initial prompt
    const promptSpan = document.querySelector('#terminalInputLine .prompt');
    if (promptSpan) {
        promptSpan.textContent = PROMPT;
    }

    // Terminal command handling
    if (commandInput) {
        commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const command = commandInput.value.trim();
                executeCommand(command);
                commandInput.value = '';
                if (command) {
                    commandHistory.push(command);
                    historyIndex = commandHistory.length;
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (commandHistory.length > 0 && historyIndex > 0) {
                    historyIndex--;
                    commandInput.value = commandHistory[historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    commandInput.value = commandHistory[historyIndex];
                } else {
                    historyIndex = commandHistory.length;
                    commandInput.value = '';
                }
            }
        });
    }
    
    // Focus on terminal click
    if (terminalContent) {
        terminalContent.addEventListener('click', () => {
            if (commandInput) {
                commandInput.focus();
            }
        });
    }

    function executeCommand(command) {
        // Show the command that was entered
        const commandLine = document.createElement('div');
        commandLine.className = 'terminal-line';
        commandLine.innerHTML = `<span class="prompt">${PROMPT}</span>${escapeHtml(command)}`;
        terminalOutput.appendChild(commandLine);

        // Execute the command and show output
        let output = '';
        if (command.trim() === '') {
            // Empty command, just show new prompt
            output = '';
        } else {
            const args = command.trim().split(/\s+/);
            const cmd = args[0].toLowerCase();
            
            if (commands[cmd]) {
                output = commands[cmd](args.slice(1));
            } else {
                output = `bash: ${cmd}: command not found`;
            }
        }
        
        if (output) {
            const outputLine = document.createElement('div');
            outputLine.className = 'terminal-line';
            outputLine.innerHTML = output;
            terminalOutput.appendChild(outputLine);
        }

        // Scroll to bottom
        terminalContent.scrollTop = terminalContent.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    const commands = {
        help: () => {
            const commandList = {
                'about': 'Display information about me.',
                'skills': 'Show technical skills.',
                'projects': 'List featured projects.',
                'experience': 'Show professional experience.',
                'contact': 'Display contact information.',
                'clear': 'Clear terminal screen.',
                'whoami': 'Display current user.',
                'date': 'Show current date and time.',
                'ls': 'List directory contents.',
                'pwd': 'Print working directory.',
                'echo': 'Display a line of text.'
            };
            
            let output = `GNU bash, version 5.2.15(1)-release (aarch64-apple-darwin22.1.0)<br>`;
            output += `These shell commands are defined internally. Type 'help' to see this list.<br><br>`;
            
            for (const [cmd, desc] of Object.entries(commandList)) {
                output += `<strong>${cmd.padEnd(12)}</strong> ${desc}<br>`;
            }
            
            return output;
        },
        
        about: () => {
            return `<strong>Trung Mai - Full Stack Developer</strong><br><br>` +
                   `"I'm Trung, a passionate Software Engineer who loves tackling challenges ` +
                   `across the entire stack. I build responsive web solutions with React, Node.js, ` +
                   `and Express.js, and I'm equally fascinated by low-level programming, especially ` +
                   `Operating Systems, and how they power software. My goal is to create efficient, ` +
                   `maintainable code that genuinely enhances user experience and system performance."<br><br>` +
                   `<strong>Passionate about:</strong><br>` +
                   `• Full stack web development<br>` +
                   `• Operating systems and low-level programming<br><br>` +
                   `<strong>Goal:</strong> Build efficient, maintainable, user- and performance-focused software.`;
        },
        
        skills: () => {
            return `<strong>--- Technical Skills ---</strong><br><br>` +
                   `<strong>Programming Languages:</strong><br>` +
                   `Python, Java, C++, C, Golang, SQL, JavaScript, TypeScript, Swift, Assembly, HTML/CSS<br><br>` +
                   `<strong>Frameworks:</strong><br>` +
                   `React.js, Express.js, Node.js, Tailwind CSS<br><br>` +
                   `<strong>Databases:</strong><br>` +
                   `MySQL, PostgreSQL, MongoDB, Firebase<br><br>` +
                   `<strong>Tools/Platforms:</strong><br>` +
                   `Git, Kernel development, CI/CD pipelines, Linux, RISC-V, Virtual Machine, VS Code, Vite, AWS, Google Cloud Platform, Azure`;
        },
        
        projects: () => {
            return `<strong>--- Featured Projects ---</strong><br><br>` +
                   `<strong>JoJo Operating System</strong><br>` +
                   `A 32-bit educational RISC-V OS kernel. Features multitasking, virtual memory, ` +
                   `a VirtIO block driver, a TAR file system, and a functional shell.<br><br>` +
                   `<strong>Task Management App</strong><br>` +
                   `A real-time application for team coordination and task tracking. Built with Vue.js, ` +
                   `Express.js, and Socket.io for live updates.<br><br>` +
                   `<strong>AI-Powered Dashboard</strong><br>` +
                   `An ML analytics dashboard for visualizing complex data sets. Built with Python ` +
                   `on the backend, React for the frontend, and hosted on AWS.`;
        },
        
        experience: () => {
            return `<strong>--- Professional Experience ---</strong><br><br>` +
                   `<strong>Senior Full Stack Developer</strong><br>` +
                   `TechCorp Solutions | Jan 2022 – Present<br>` +
                   `Led development of enterprise-scale applications for 50K+ users, designed and ` +
                   `implemented microservices architecture, and mentored a team of developers.<br><br>` +
                   `<strong>Full Stack Developer</strong><br>` +
                   `Digital Innovations Inc. | Mar 2020 – Dec 2021<br>` +
                   `Built and maintained full-stack client projects, optimized application performance ` +
                   `achieving 95+ Lighthouse scores, and delivered pixel-perfect UIs.<br><br>` +
                   `<strong>Frontend Developer</strong><br>` +
                   `StartupXYZ | Jun 2018 – Feb 2020<br>` +
                   `Developed responsive web apps with a focus on real-time features using WebSockets ` +
                   `and collaborated with stakeholders to define tech requirements.<br><br>` +
                   `<strong>Junior Web Developer</strong><br>` +
                   `WebDev Agency | Sep 2017 – May 2018<br>` +
                   `Built custom WordPress websites and gained foundational experience in agile ` +
                   `methodologies and version control with Git.`;
        },
        
        contact: () => {
            return `<strong>--- Get In Touch ---</strong><br><br>` +
                   `<a href="https://github.com/JoJoMai" target="_blank">🔗 GitHub</a><br>` +
                   `<a href="https://www.linkedin.com/in/trung-mai/" target="_blank">🔗 LinkedIn</a><br>` +
                   `<a href="https://www.instagram.com/frogcheems/" target="_blank">🔗 Instagram</a>`;
        },
        
        clear: () => {
            terminalOutput.innerHTML = `<div class="terminal-line">Last login: ${new Date().toDateString()} on ttys001</div>` +
                                     `<div class="terminal-line">Welcome to Trung Mai's interactive portfolio (2025)</div>`;
            return '';
        },
        
        whoami: () => 'trungmai',
        
        date: () => new Date().toString(),
        
        pwd: () => '/Users/trungmai',
        
        ls: (args) => {
            const files = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'portfolio.json', 'projects/', 'resume.pdf'];
            if (args.includes('-la') || args.includes('-l')) {
                let output = 'total 8<br>';
                files.forEach(file => {
                    const isDir = file.endsWith('/');
                    const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                    const size = isDir ? '4096' : Math.floor(Math.random() * 10000) + 1000;
                    const date = 'Dec 15 10:30';
                    output += `${perms}  1 trungmai staff  ${size}  ${date} ${file}<br>`;
                });
                return output;
            }
            return files.join('&nbsp;&nbsp;&nbsp;&nbsp;');
        },
        
        echo: (args) => args.join(' ')
    };
    
    // Initialize with proper z-index
    document.getElementById('portfolioWindow').style.zIndex = 1001;
    document.getElementById('terminalWindow').style.zIndex = 1002;
    updateActiveWindow();
});
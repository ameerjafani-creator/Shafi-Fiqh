
        // Initialize Icons
        lucide.createIcons();

        // Provided Gemini API Key
        const apiKey = "AIzaSyBtTI6FiyWbqDe2Yg7V_emgV_dZH6KxTlQ"; 

        const chatBox = document.getElementById('chat-box');
        const chatForm = document.getElementById('chat-form');

        // --- 1. Date Display ---
        function updateDate() {
            const dateObj = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('current-date').innerHTML = `<i data-lucide="calendar" class="w-4 h-4"></i> ${dateObj.toLocaleDateString('en-US', options)}`;
            
            // Format Hijri Date roughly using Intl (Browser dependent, but works well)
            try {
                const hijriDate = new Intl.DateTimeFormat('en-US-u-ca-islamic', {day: 'numeric', month: 'long', year : 'numeric'}).format(dateObj);
                document.getElementById('hijri-date').innerText = hijriDate;
            } catch(e) {
                document.getElementById('hijri-date').innerText = "";
            }
            lucide.createIcons();
        }
        updateDate();

        // --- 2. Image Sliders Logic ---
        // Main Banner Slider
        let currentSlide = 1;
        const totalSlides = 3;
        setInterval(() => {
            document.getElementById(`slide-${currentSlide}`).classList.replace('opacity-100', 'opacity-0');
            document.getElementById(`slide-${currentSlide}`).classList.replace('z-10', 'z-0');
            
            currentSlide = currentSlide < totalSlides ? currentSlide + 1 : 1;
            
            document.getElementById(`slide-${currentSlide}`).classList.replace('opacity-0', 'opacity-100');
            document.getElementById(`slide-${currentSlide}`).classList.replace('z-0', 'z-10');
        }, 5000); // Change image every 5 seconds

        // Mistly Perfumes Ad Slider
        let currentAdSlide = 1;
        const totalAdSlides = 3;
        setInterval(() => {
            document.getElementById(`ad-slide-${currentAdSlide}`).classList.replace('opacity-100', 'opacity-0');
            document.getElementById(`ad-slide-${currentAdSlide}`).classList.replace('z-10', 'z-0');
            
            currentAdSlide = currentAdSlide < totalAdSlides ? currentAdSlide + 1 : 1;
            
            document.getElementById(`ad-slide-${currentAdSlide}`).classList.replace('opacity-0', 'opacity-100');
            document.getElementById(`ad-slide-${currentAdSlide}`).classList.replace('z-0', 'z-10');
        }, 4000); // Ad changes slightly faster (every 4s)

        // --- 3. Prayer Times Logic (Aladhan API) ---
        async function fetchPrayerTimes(lat, lng, locationName) {
            try {
                document.getElementById('location-text').innerText = `Location: ${locationName}`;
                // Method 8 is Gulf Region / Standard for India
                const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=8`);
                const data = await res.json();
                
                if (data.code === 200) {
                    const timings = data.data.timings;
                    
                    // Convert 24hr to 12hr format
                    const formatTime = (time24) => {
                        let [hours, minutes] = time24.split(':');
                        hours = parseInt(hours);
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12 || 12;
                        return `${hours}:${minutes} ${ampm}`;
                    };

                    document.getElementById('time-fajr').innerText = formatTime(timings.Fajr);
                    document.getElementById('time-dhuhr').innerText = formatTime(timings.Dhuhr);
                    document.getElementById('time-asr').innerText = formatTime(timings.Asr);
                    document.getElementById('time-maghrib').innerText = formatTime(timings.Maghrib);
                    document.getElementById('time-isha').innerText = formatTime(timings.Isha);
                }
            } catch (error) {
                console.error("Error fetching prayer times:", error);
                document.getElementById('location-text').innerText = "Error loading times.";
            }
        }

        function requestLocation() {
            document.getElementById('location-text').innerText = "Detecting location...";
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        // Try to get city name via reverse geocoding (Nominatim - open street map)
                        try {
                            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
                            const geoData = await geoRes.json();
                            const city = geoData.address.city || geoData.address.state_district || geoData.address.state || "Detected Location";
                            fetchPrayerTimes(lat, lng, city);
                        } catch(e) {
                            fetchPrayerTimes(lat, lng, "Your Location");
                        }
                    },
                    (error) => {
                        console.warn("Geolocation blocked or failed. Using default location.");
                        // Default to Melmuri, Kerala (from context)
                        fetchPrayerTimes(11.0722, 76.0594, "Malappuram, Kerala");
                    }
                );
            } else {
                // Default fallback
                fetchPrayerTimes(11.0722, 76.0594, "Malappuram, Kerala");
            }
        }
        
        // Load default prayer times on init
        requestLocation();

        // --- 4. Chat & API Logic ---
        document.getElementById('user-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatForm.dispatchEvent(new Event('submit'));
            }
        });

        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputField = document.getElementById('user-input');
            const question = inputField.value.trim();
            if (!question) return;

            addMessage(question, 'user');
            inputField.value = '';
            
            const loadingId = addLoading();

            try {
                const response = await fetchFromGemini(question);
                document.getElementById(loadingId).remove();
                addMessage(response, 'bot', question);
            } catch (error) {
                if(document.getElementById(loadingId)) {
                    document.getElementById(loadingId).remove();
                }
                addMessage("Sorry, unable to fetch the answer right now. Please check your internet connection or try again later. ⚠️", 'error');
                console.error(error);
            }
        });

        function addMessage(text, sender, originalQuestion = '') {
            const wrapper = document.createElement('div');
            wrapper.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} w-full animate-fade-in`;
            
            const messageDiv = document.createElement('div');
            
            if (sender === 'user') {
                messageDiv.className = 'bg-emerald-500 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%] shadow-lg text-sm md:text-base whitespace-pre-wrap';
                messageDiv.textContent = text;
            } else if (sender === 'error') {
                messageDiv.className = 'bg-red-900/80 text-red-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] shadow-md text-sm border border-red-700/50 backdrop-blur-sm';
                messageDiv.textContent = text;
            } else {
                // Bot message Dark Theme
                messageDiv.className = 'bg-emerald-900/80 text-emerald-50 border border-emerald-700/50 rounded-2xl rounded-tl-none px-4 pt-3 pb-12 max-w-[95%] md:max-w-[85%] shadow-lg text-sm md:text-base relative backdrop-blur-sm';
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'markdown-body';
                contentDiv.innerHTML = mdToHtml(text);
                messageDiv.appendChild(contentDiv);

                // Share Buttons Container
                const actionContainer = document.createElement('div');
                actionContainer.className = 'absolute bottom-2 right-2 flex gap-2 mt-2';

                // WhatsApp Share Button
                const waBtn = document.createElement('button');
                waBtn.className = 'flex items-center gap-1.5 text-xs bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 border border-[#25D366]/50 px-2.5 py-1.5 rounded-md transition-colors font-semibold shadow-sm backdrop-blur-md';
                waBtn.innerHTML = `<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Share`;
                
                waBtn.onclick = () => {
                    const waFormattedText = formatForWhatsApp(originalQuestion, text);
                    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waFormattedText)}`;
                    window.open(whatsappUrl, '_blank');
                };

                // Copy Button
                const copyBtn = document.createElement('button');
                copyBtn.className = 'flex items-center gap-1.5 text-xs bg-gray-800/50 text-gray-300 hover:bg-gray-700/80 border border-gray-600/50 px-2.5 py-1.5 rounded-md transition-colors shadow-sm backdrop-blur-md';
                copyBtn.innerHTML = `<i data-lucide="copy" class="w-4 h-4"></i> Copy`;
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(text).then(() => {
                        const originalHtml = copyBtn.innerHTML;
                        copyBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i> Copied`;
                        lucide.createIcons({ root: copyBtn });
                        setTimeout(() => {
                            copyBtn.innerHTML = originalHtml;
                            lucide.createIcons({ root: copyBtn });
                        }, 2000);
                    }).catch(err => {
                        const textarea = document.createElement('textarea');
                        textarea.value = text;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                    });
                };

                actionContainer.appendChild(copyBtn);
                actionContainer.appendChild(waBtn);
                messageDiv.appendChild(actionContainer);
            }
            
            wrapper.appendChild(messageDiv);
            chatBox.appendChild(wrapper);
            
            if (sender === 'bot') {
                lucide.createIcons({ root: wrapper });
            }

            scrollToBottom();
        }

        function addLoading() {
            const id = 'loading-' + Date.now();
            const wrapper = document.createElement('div');
            wrapper.id = id;
            wrapper.className = `flex justify-start w-full animate-pulse`;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'bg-emerald-900/80 border border-emerald-700/50 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2 text-sm text-emerald-300 backdrop-blur-sm';
            messageDiv.innerHTML = `
                <div class="flex gap-1">
                    <div class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
                <span class="ml-2">Seeking knowledge...</span>
            `;
            
            wrapper.appendChild(messageDiv);
            chatBox.appendChild(wrapper);
            scrollToBottom();
            return id;
        }

        function scrollToBottom() {
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        function clearChat() {
            chatBox.innerHTML = `
                <div class="flex justify-start">
                    <div class="bg-emerald-900/80 text-emerald-50 border border-emerald-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] shadow-md text-sm md:text-base backdrop-blur-sm">
                        Assalamu Alaikum 🌙. You can ask your doubts regarding Shafi'i Fiqh here. I will reply in the language you use (English, Malayalam, or Manglish).
                    </div>
                </div>
            `;
        }

        // --- 5. Formatters ---
        function mdToHtml(md) {
            let html = md;
            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
            html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
            html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
            html = html.replace(/^\s*[\*-]\s+(.*$)/gim, '<li>🔹 $1</li>');
            html = html.replace(/<\/li>\n<li>/g, '</li><li>'); 
            html = html.replace(/\n(?![^<]*>)/g, '<br>');
            return html;
        }

        function formatForWhatsApp(question, responseText) {
            let text = responseText;
            text = text.replace(/^###\s+(.*)$/gm, '\n*$1*\n');
            text = text.replace(/^##\s+(.*)$/gm, '\n*$1*\n');
            text = text.replace(/^#\s+(.*)$/gm, '\n*$1*\n');
            text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
            text = text.replace(/^\s*[\*-]\s+/gm, '🔹 ');
            
            let finalMessage = `*Question:* ${question}\n\n*Answer:*\n${text}\n\n_Generated via Shafi Fiqh By Jafani_ 🕌`;
            return finalMessage;
        }

        // --- 6. Gemini API Interaction ---
        async function fetchFromGemini(query) {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            
            const systemPrompt = `You are a highly knowledgeable, respectful Islamic scholar specializing strictly in the Shafi'i madhhab. 
            Answer user questions regarding Islamic jurisprudence (Fiqh) according to Imam Shafi'i's school. 
            Prioritize the mu'tamad (relied-upon) position.
            
            CRITICAL INSTRUCTION: Analyze the language of the query. You MUST reply entirely in the SAME language used to ask the question:
            - If English, reply in English.
            - If Malayalam script, reply in Malayalam script.
            - If Manglish (Malayalam written in English alphabet), reply in Manglish.

            Rules:
            - Use Markdown headings (##) and bold text (**text**).
            - Use bullet points (*) for lists.
            - Include relevant Islamic emojis (🕌, 🌙, 🤲, ✅) naturally to enhance the aesthetic.
            - Keep the tone respectful, scholarly, and helpful. Remind them to consult local scholars for critical personal fatwas.`;

            const payload = {
                contents: [{ parts: [{ text: query }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Invalid response format from AI");
            }
        }
    

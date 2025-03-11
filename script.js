document.addEventListener('DOMContentLoaded', () => {
    let hourlyData = JSON.parse(localStorage.getItem('hourlyData')) || [];
    let now = new Date();
    let currentHour = now.getHours();
    let currentMinute = now.getMinutes();
    let totalGeneratedToday = 0;
    let totalConsumedToday = 0;
    let isDarkMode = localStorage.getItem('darkMode') === 'enabled';

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-icon').classList.remove('fa-sun');
        document.getElementById('theme-icon').classList.add('fa-moon');
    }

    let generatedThisMinute = 0;
    let consumedThisMinute = 0;

    function generateDummyData() {
        let generated = 0;
        let consumed = 0;
        let baseConsumption = 0.1;
        let solarFactor = 0;
        let ampere = 0;
        let voltage = 0;

        // Get current date and time
        const now = new Date();
        const hour = now.getHours();
        const month = now.getMonth(); // Month (0-11)
        const day = now.getDate(); // Day of the month (1-31)

        // Latitude and Longitude of ITERA, Lampung
        const latitude = -5.3768; // Approximate Latitude
        const longitude = 105.3166; // Approximate Longitude

        // Function to calculate the Sun's position (simplified)
        function calculateSunPosition(latitude, longitude, year, month, day, hour) {
            // Simplified calculations. For a more accurate implementation,
            // use a dedicated library like 'suncalc' or a more detailed algorithm.

            // Approximate Declination of the Sun (degrees)
            const declination = 23.45 * Math.cos((360 / 365) * (day + 10));

            // Hour Angle (degrees)
            const hourAngle = 15 * (hour - 12);

            // Solar Altitude (degrees)
            const solarAltitude = Math.asin(
                Math.sin(latitude * Math.PI / 180) * Math.sin(declination * Math.PI / 180) +
                Math.cos(latitude * Math.PI / 180) * Math.cos(declination * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
            ) * 180 / Math.PI;

            // Azimuth (simplified)
            const azimuth = 180 + hourAngle; // Rough approximation. Use a proper calculation for accuracy.

            return { altitude: solarAltitude, azimuth: azimuth };
        }

        const sunPosition = calculateSunPosition(latitude, longitude, now.getFullYear(), month + 1, day, hour);
        const solarAltitude = sunPosition.altitude;

        // Cloud cover factor (simulates varying weather)
        const cloudCover = Math.random(); // Random value between 0 and 1 (0 = clear, 1 = overcast)

        // Potential maximum generation (adjust based on panel capacity and local irradiance)
        const maxGenerationPotential = 1.8; // kW - Adjusted for Lampung's potential

        if (solarAltitude > 0) {  // Sun is above the horizon

            // Solar intensity based on sun altitude and cloud cover
            let solarIntensity = Math.max(0, Math.sin(solarAltitude * Math.PI / 180)); // Solar altitude determines intensity

            // Apply cloud cover to solar intensity
            solarIntensity *= (1 - cloudCover);

            generated = maxGenerationPotential * solarIntensity;
            generated = Math.max(0, generated);

            // Realistic values (adjust these as needed) - Increased Ampere and Voltage
            ampere = Math.random() * 8 + 4; // Increased range
            voltage = Math.random() * 6 + 20; //Increased Voltage

        } else {
            // Night time - minimal generation
            generated = 0.005 + Math.random() * 0.01;  // Minimal "leakage" or standby power
            ampere = Math.random() * 0.2;
            voltage = Math.random() * 0.5 + 16;
        }

        // Base consumption adjusted for ITERA's possible usage
        baseConsumption = 0.15;

        consumed = baseConsumption + Math.random() * 0.4 + solarFactor; // Higher consumption range
        consumed = Math.max(consumed, 0.1);  // Minimum consumption

        //Solar factor can reduce consumption (if generating more than consuming)
        solarFactor = Math.min(generated, consumed) * 0.2; // Use up to 20% of generated power to offset

        return {
            generated: generated,
            consumed: consumed,
            ampere: ampere,
            voltage: voltage
        };
    }

    function createInitialHourlyData() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        if (hourlyData.length === 0) {
            for (let i = 0; i <= currentHour; i++) {
                for (let j = 0; j < 60; j++) {
                    if (i === currentHour && j > currentMinute) break;

                    let generatedSum = 0;
                    let consumedSum = 0;

                    const data = generateDummyData();
                    generatedSum += data.generated;
                    consumedSum += data.consumed;

                    hourlyData.push({
                        hour: i,
                        minute: j,
                        generated: generatedSum,
                        consumed: consumedSum
                    });
                }
            }
            localStorage.setItem('hourlyData', JSON.stringify(hourlyData));
        }
    }

    function updateDisplay() {
        let data = generateDummyData();
        generatedThisMinute += data.generated;
        consumedThisMinute += data.consumed;

        document.getElementById('realtime-generated').textContent = data.generated.toFixed(2) + ' kW';
        document.getElementById('realtime-consumed').textContent = data.consumed.toFixed(2) + ' kW';
        document.getElementById('realtime-ampere').textContent = data.ampere.toFixed(2) + ' A';
        document.getElementById('realtime-voltage').textContent = data.voltage.toFixed(2) + ' V';
    }

    function updateHourlyData() {
        const now = new Date();
        currentHour = now.getHours();
        currentMinute = now.getMinutes();

        const newHourlyData = {
            hour: currentHour,
            minute: currentMinute,
            generated: generatedThisMinute,
            consumed: consumedThisMinute
        };

        // Check if the data for this minute already exists
        let indexData = hourlyData.findIndex(item => item.hour === currentHour && item.minute === currentMinute);

        if (indexData !== -1) {
            // Update existing data by adding the new values
            hourlyData[indexData].generated += newHourlyData.generated;
            hourlyData[indexData].consumed += newHourlyData.consumed;
        } else {
            // Add new data
            hourlyData.push(newHourlyData);
        }

        // Filter out data from previous days. This is crucial for keeping the data relevant and the chart clean.
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        hourlyData = hourlyData.filter(item => {
            const itemDate = new Date(today); // Create a new date object initialized to the start of today.
            itemDate.setHours(item.hour, item.minute, 0, 0);  // Set the hours and minutes based on the data item.

            return itemDate <= now; // Keep data that is up to the current time today.
        });

        localStorage.setItem('hourlyData', JSON.stringify(hourlyData));
        updateChart();

        generatedThisMinute = 0;
        consumedThisMinute = 0;
    }

    function updateDailyStats() {
        totalGeneratedToday = hourlyData.reduce((sum, item) => sum + item.generated, 0);
        totalConsumedToday = hourlyData.reduce((sum, item) => sum + item.consumed, 0);
        document.getElementById('daily-total-generated').textContent = totalGeneratedToday.toFixed(2) + ' kWh';
        document.getElementById('daily-total-consumed').textContent = totalConsumedToday.toFixed(2) + ' kWh';

        let selfSufficiency = (totalConsumedToday > 0) ? (Math.min(totalGeneratedToday, totalConsumedToday) / totalConsumedToday) * 100 : 0;
        document.getElementById('daily-self-sufficiency').textContent = selfSufficiency.toFixed(0) + ' %';
    }

    let hourlyChart;

    function updateChart() {
        const ctx = document.getElementById('hourly-chart').getContext('2d');

        if (hourlyChart) {
            hourlyChart.destroy();
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const labels = hourlyData.map(item => {
            const itemDate = new Date(today);
            itemDate.setHours(item.hour, item.minute);
            const hour = String(item.hour).padStart(2, '0');
            const minute = String(item.minute).padStart(2, '0');
            return `${hour}:${minute}`;
        });


        hourlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Dihasilkan',
                    data: hourlyData.map(item => item.generated),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: false
                }, {
                    label: 'Dikonsumsi',
                    data: hourlyData.map(item => item.consumed),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false
                }]
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Waktu'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'kW'
                        }
                    }
                }
            }
        });
    }

    function checkNewHour() {
        let now = new Date();
        let newHour = now.getHours();
        let newMinute = now.getMinutes();

        if (newHour !== currentHour || newMinute !== currentMinute) {
            updateHourlyData();
            updateDailyStats();
            currentHour = newHour;
            currentMinute = newMinute;
        }
    }

    createInitialHourlyData()
    updateChart();
    updateDailyStats()

    setInterval(updateDisplay, 5000);

    setInterval(checkNewHour, 60000); // Update every minute

    document.getElementById('theme-toggle').addEventListener('click', function(e) {
        e.preventDefault();
        if (document.body.classList.contains('dark-mode')) {
            document.body.classList.remove('dark-mode');
            document.getElementById('theme-icon').classList.remove('fa-moon');
            document.getElementById('theme-icon').classList.add('fa-sun');
            localStorage.setItem('darkMode', null);
        } else {
            document.body.classList.add('dark-mode');
            document.getElementById('theme-icon').classList.remove('fa-sun');
            document.getElementById('theme-icon').classList.add('fa-moon');
            localStorage.setItem('darkMode', 'enabled');
        }
    });

});
document.addEventListener('DOMContentLoaded', () => {
    let hourlyData = JSON.parse(localStorage.getItem('hourlyData')) || [];
    let now = new Date();
    let currentHour = now.getHours();
    let currentMinute = now.getMinutes();
    let isDarkMode = localStorage.getItem('darkMode') === 'enabled';

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-icon').classList.remove('fa-sun');
        document.getElementById('theme-icon').classList.add('fa-moon');
    }

    // Accumulators
    let generatedThisMinute = 0;
    let inverterOutputThisMinute = 0;
    let totalAmpereThisMinute = 0;
    let totalVoltageThisMinute = 0;

    function generateDummyData() {
        let generated = 0;
        let inverterOutput = 0;
        let ampere = 0;
        let voltage = 0;

        const now = new Date();
        const hour = now.getHours();
        const month = now.getMonth();
        const day = now.getDate();

        const latitude = -5.3768;
        const longitude = 105.3166;

        function calculateSunPosition(latitude, longitude, year, month, day, hour) {
            const declination = 23.45 * Math.cos((360 / 365) * (day + 10));
            const hourAngle = 15 * (hour - 12);
            const solarAltitude = Math.asin(
                Math.sin(latitude * Math.PI / 180) * Math.sin(declination * Math.PI / 180) +
                Math.cos(latitude * Math.PI / 180) * Math.cos(declination * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
            ) * 180 / Math.PI;
            const azimuth = 180 + hourAngle;
            return { altitude: solarAltitude, azimuth: azimuth };
        }

        const sunPosition = calculateSunPosition(latitude, longitude, now.getFullYear(), month + 1, day, hour);
        const solarAltitude = sunPosition.altitude;
        const cloudCover = Math.random();
        const maxGenerationPotential = 420;

        if (solarAltitude > 0) {
            let solarIntensity = Math.max(0, Math.sin(solarAltitude * Math.PI / 180));
            solarIntensity *= (1 - cloudCover);
            generated = maxGenerationPotential * solarIntensity;
            generated = Math.max(0, generated);
            ampere = Math.random() * 0.5 + 0.2;
            voltage = Math.random() * 1 + 4.5;
            inverterOutput = 217 + Math.random() * 2;
        } else {
            generated = 0.05 + Math.random() * 0.1;
            ampere = Math.random() * 0.05;
            voltage = Math.random() * 0.2 + 4.3;
            inverterOutput = 216 + Math.random() * 1;
        }

        return {
            generated: generated,
            inverterOutput: inverterOutput,
            ampere: ampere,
            voltage: voltage
        };
    }

function createInitialHourlyData() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (hourlyData.length === 0) {
            console.log("Creating initial hourly data...");
            for (let i = 0; i < 24; i++) {
                for (let j = 0; j < 60; j += 30) {
                    const itemDate = new Date(today);
                    itemDate.setHours(i, j, 0, 0);
                   if (itemDate <= now) {
                      const data = generateDummyData();

                      hourlyData.push({
                          timestamp: itemDate.getTime(),
                          generated: data.generated,
                          inverterOutput: data.inverterOutput,
                          ampere: data.ampere,
                          voltage: data.voltage
                      });
                  } else {
                       hourlyData.push({
                          timestamp: itemDate.getTime(),
                          generated: 0,
                          inverterOutput: 0,
                          ampere: 0,
                          voltage: 0
                      });
                  }
                }
            }
            localStorage.setItem('hourlyData', JSON.stringify(hourlyData));
            console.log("Initial hourly data created and stored in localStorage:", hourlyData);
        } else {
            console.log("Hourly data already exists in localStorage:", hourlyData);
            for (let i = 0; i <= currentHour; i++) {
                for (let j = 0; j < 60; j += 30) {

                    const itemDate = new Date(today);
                    itemDate.setHours(i, j, 0, 0);

                    if (!hourlyData.find(item => item.timestamp === itemDate.getTime())) {
                        const data = generateDummyData();
                        hourlyData.push({
                            timestamp: itemDate.getTime(),
                            generated: data.generated,
                            inverterOutput: data.inverterOutput,
                            ampere: data.ampere,
                            voltage: data.voltage
                        });
                    }
                }
            }
        }
        localStorage.setItem('hourlyData', JSON.stringify(hourlyData));
    }

    function updateDisplay() {
        let data = generateDummyData();

        generatedThisMinute += data.generated;
        inverterOutputThisMinute += data.inverterOutput;
        totalAmpereThisMinute += data.ampere;
        totalVoltageThisMinute += data.voltage;

        document.getElementById('realtime-generated').textContent = data.generated.toFixed(2) + ' W';
        document.getElementById('realtime-consumed').textContent = data.inverterOutput.toFixed(2) + ' VAC';
        document.getElementById('realtime-ampere').textContent = data.ampere.toFixed(2) + ' A';
        document.getElementById('realtime-voltage').textContent = data.voltage.toFixed(2) + ' VDC';
    }

    function updateHourlyData() {
        const now = new Date();
        currentHour = now.getHours();
        currentMinute = now.getMinutes();

        // Update the data every 30 minutes
        if (currentMinute % 30 === 0) {
             const itemDate = new Date();
             itemDate.setHours(currentHour, currentMinute, 0, 0);

             let indexData = hourlyData.findIndex(item => item.timestamp === itemDate.getTime());

             if (indexData !== -1) {
               hourlyData[indexData].generated = generatedThisMinute;
               hourlyData[indexData].inverterOutput = inverterOutputThisMinute;
               hourlyData[indexData].ampere = totalAmpereThisMinute;
               hourlyData[indexData].voltage = totalVoltageThisMinute;

            } else {
                  hourlyData.push({
                            timestamp: itemDate.getTime(),
                            generated: generatedThisMinute,
                            inverterOutput: inverterOutputThisMinute,
                            ampere: totalAmpereThisMinute,
                            voltage: totalVoltageThisMinute
                  });
            }
            // Reset accumulators
            generatedThisMinute = 0;
            inverterOutputThisMinute = 0;
            totalAmpereThisMinute = 0;
            totalVoltageThisMinute = 0;
        }

        // Persist and update chart if data is changed
        localStorage.setItem('hourlyData', JSON.stringify(hourlyData));
        updateChart();
    }

   function updateDailyStats() {
    // Reset accumulators for Daily Stats
    let totalGeneratedToday = 0;
    let totalInverterOutputToday = 0;
    let totalAmpere = 0;
    let totalVoltage = 0;
    let numReadings = 0;

    // Iterate through hourly data, sum values, and count readings
    for (let i = 0; i < hourlyData.length; i++) {
        const itemDate = new Date(hourlyData[i].timestamp);
        const today = new Date();
        today.setHours(0, 0, 0, 0);  // Set today to midnight

        if (itemDate >= today) {  // Only process data from today
            totalGeneratedToday += hourlyData[i].generated;
            totalInverterOutputToday += hourlyData[i].inverterOutput;
            totalAmpere += hourlyData[i].ampere;
            totalVoltage += hourlyData[i].voltage;
            numReadings++;
        }
    }

    // Calculate averages - Guard against division by zero
    let avgAmpere = numReadings > 0 ? totalAmpere / numReadings : 0;
    let avgVoltage = numReadings > 0 ? totalVoltage / numReadings : 0;
    let avgInverterOutput = numReadings > 0 ? totalInverterOutputToday / numReadings : 0;

    // Update Daily Statistics Display - Make sure numbers are valid
    document.getElementById('daily-total-generated').textContent = totalGeneratedToday.toFixed(2) + ' Wh';
    document.getElementById('daily-total-consumed').textContent = avgInverterOutput.toFixed(2) + ' VAC'; // Ensure calculations are correct

    const dailyStatsElement = document.getElementById('daily-self-sufficiency');
    dailyStatsElement.innerHTML = 'Sensor Readings:<br>';
    dailyStatsElement.innerHTML += `<i class="fas fa-bolt me-1"></i> Avg Ampere: ${avgAmpere.toFixed(2)} A<br>`;
    dailyStatsElement.innerHTML += `<i class="fas fa-bolt me-1"></i> Avg Voltage: ${avgVoltage.toFixed(2)} VDC`;

        // Debugging - Add console logs here:
        console.log('totalGeneratedToday:', totalGeneratedToday);
        console.log('totalInverterOutputToday:', totalInverterOutputToday);
        console.log('numReadings:', numReadings);
        console.log('avgInverterOutput:', avgInverterOutput);
    }

    let hourlyChart;
   function updateChart() {
        const ctx = document.getElementById('hourly-chart').getContext('2d');

        if (hourlyChart) {
            hourlyChart.destroy();
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const chartData = hourlyData.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= today && itemDate <= now;
        });

        const labels = chartData.map(item => {
            const itemDate = new Date(item.timestamp);
            const hour = String(itemDate.getHours()).padStart(2, '0');
            const minute = String(itemDate.getMinutes()).padStart(2, '0');
            return `${hour}:${minute}`;
        });

        hourlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Generated (W)',
                    data: chartData.map(item => item.generated),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: false
                },
                {
                    label: 'Inverter Output (VAC)',
                    data: chartData.map(item => item.inverterOutput),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false
                }
              ]
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 90,
                            minRotation: 90
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Value'
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

    setInterval(checkNewHour, 60000);

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

     // Initial calls
    setInterval(updateDisplay, 5000); // Update every 5 seconds
    setInterval(updateHourlyData, 30 * 60 * 1000); // Update every 30 minutes (Chart + localStorage)
    setInterval(updateDailyStats,  60 * 1000);
});
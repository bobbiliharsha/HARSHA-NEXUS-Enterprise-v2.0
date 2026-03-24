import React, { useEffect, useState } from 'react';

const WeatherDashboard = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&hourly=temperature_2m');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setWeatherData(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchWeatherData();
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!weatherData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Weather Dashboard</h1>
            <h2>Current Weather:</h2>
            <ul>
                {weatherData.hourly.temperature_2m.map((temp, index) => (
                    <li key={index}>Hour {index}: {temp}°C</li>
                ))}
            </ul>
        </div>
    );
};

export default WeatherDashboard;

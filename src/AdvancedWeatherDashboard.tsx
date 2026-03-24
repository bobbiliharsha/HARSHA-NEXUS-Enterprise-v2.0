import React, { useState, useEffect } from 'react';

const AdvancedWeatherDashboard = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [location, setLocation] = useState('New York');
    const [unit, setUnit] = useState('metric'); // 'metric' for Celsius, 'imperial' for Fahrenheit
    const [error, setError] = useState(null);

    const fetchWeatherData = async () => {
        const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&hourly=temperature_2m,precipitation_sum&daily=temperature_2m_max,temperature_2m_min&timezone=America/New_York`;
        
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setWeatherData(data);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchWeatherData();
    }, [location, unit]);

    if (error) return <div>Error: {error}</div>;
    if (!weatherData) return <div>Loading...</div>;

    return (
        <div>
            <h1>Advanced Weather Dashboard</h1>
            <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
            />
            <select onChange={(e) => setUnit(e.target.value)} value={unit}>
                <option value="metric">Celsius</option>
                <option value="imperial">Fahrenheit</option>
            </select>
            <h2>Current Weather</h2>
            <div>
                {weatherData.current_weather.temperature} °{unit === 'metric' ? 'C' : 'F'}
            </div>
            <h2>8-Day Forecast</h2>
            <ul>
                {weatherData.daily.temperature_2m_max.map((temp, index) => (
                    <li key={index}>
                        Day {index + 1}: Max: {temp} °{unit === 'metric' ? 'C' : 'F'}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AdvancedWeatherDashboard;
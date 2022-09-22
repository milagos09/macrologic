"use strict";

/**
 * If the currency is not in the cache, fetch it and store it in the cache. If it is in the cache,
 * check if it's expired. If it's expired, fetch it and store it in the cache. If it's not expired,
 * return it.
 * @param currency - The currency you want to get the exchange rates for.
 * @returns the exchanges object from the localStorage.
 */
async function checkCache(currency) {
    const result = localStorage.getItem(currency);
    if (!result) {
        const data = { expiration: Date.now() + 86400 * 1000, exchanges: await fetchCurrencyExchange(currency) };
        localStorage.setItem(currency, JSON.stringify(data));
    } else {
        const data = JSON.parse(result);
        if (data.expiration <= Date.now()) {
            const newData = { expiration: Date.now() + 86400 * 1000, exchanges: await fetchCurrencyExchange(currency) };
            localStorage.setItem(currency, JSON.stringify(newData));
        }
    }

    return JSON.parse(localStorage.getItem(currency)).exchanges;
}

/**
 * It fetches the currency exchange rate for a given currency
 * @param currency - The currency you want to convert to.
 * @returns The data object is being returned.
 */
async function fetchCurrencyExchange(currency) {
    const result = await fetch(
        `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${currency}.json`
    );

    const data = await result.json();

    return data;
}

/**
 * It fetches the exchange rates for the given currency and then groups them into three groups based on
 * their value
 * @param [currency=usd] - The currency you want to get the exchange rates for.
 */
async function getCurrencyExchange(currency = "usd") {
    const group1 = {},
        group2 = {},
        group3 = {};

    isLoading();

    try {
        const data = await checkCache(currency);

        Object.keys(currencies).forEach((key) => {
            if (key === currency) return;

            const currencyToKey = `${currency} - ${key}`;
            const keyToCurrency = `${key} - ${currency}`;
            const value = data[currency][key];

            if (value < 1) {
                group1[currencyToKey] = value;
            } else if (value < 1.5) {
                group2[currencyToKey] = value;
            } else {
                group3[currencyToKey] = value;
            }

            if (1 / value < 1) {
                group1[keyToCurrency] = 1 / value;
            } else if (1 / value < 1.5) {
                group2[keyToCurrency] = 1 / value;
            } else {
                group3[keyToCurrency] = 1 / value;
            }
        });
        generateTable(group1, "group1");
        generateTable(group2, "group2");
        generateTable(group3, "group3");
        isLoading(false);
    } catch (error) {
        console.error(error);
        alert("something went wrong!");
        isLoading(false);
    }
}

/**
 * It takes an object, converts it to an array, sorts the array, and returns the sorted array.
 * @param group - The group of objects to sort.
 * @returns An array of arrays.
 */
function sortByAscending(group) {
    const sorted = Object.entries(group).sort((a, b) => {
        return a[1] - b[1];
    });
    return sorted;
}

/**
 * It takes an object, converts it to an array, sorts it by ascending value, and then creates a table
 * row for each key-value pair.
 * @param group - The object that contains the key-value pairs.
 * @param groupName - the name of the group
 */
function generateTable(group, groupName) {
    const tableBody = document.getElementById(groupName);
    const tableFooter = document.getElementById(groupName + "-count");
    const objectToArray = sortByAscending(group);
    tableBody.innerHTML = "";

    /**
     * Creating a table row for each key-value pair.
     * Counts the number of elements with the condition of subtask 2
     */
    tableFooter.innerText = objectToArray.filter((keyValue) => {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        const td = document.createElement("td");

        th.innerText = keyValue[0].toUpperCase();
        td.innerText = keyValue[1].toFixed(2);
        tr.append(th, td);
        tableBody.appendChild(tr);

        return keyValue[1] >= 0.5 && keyValue[1] <= 1.5;
    }).length;
}

/**
 * If the state is true, then display the loading element, otherwise hide it.
 * @param [state=true] - true/false
 */
function isLoading(state = true) {
    const loading = document.querySelector(".loading");
    loading.style.display = state ? "block" : "none";
}

/* Initialize */
const currencies = {
    usd: "U.S. Dollar",
    eur: "Euro",
    aud: "Australian Dollar",
    cad: "Canadian Dollar",
    chf: "Swiss Franc",
    nzd: "New Zealand Dollar",
    bgn: "Bulgarian lev",
};

const select = document.getElementById("currencies");

select.addEventListener("change", (event) => {
    const currency = event.target.value;
    getCurrencyExchange(currency);
});

select.value = "usd";
getCurrencyExchange();

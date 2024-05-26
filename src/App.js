import { createContext, useContext, useEffect, useState } from "react";
import { HiOutlineMoon, HiOutlineSun, HiSearch } from "react-icons/hi";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate
} from "react-router-dom";

function useLocalStorageState(initialState, key) {
  const [value, setValue] = useState(function () {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : initialState;
  });

  useEffect(
    function () {
      localStorage.setItem(key, JSON.stringify(value));
    },
    [value, key]
  );

  return [value, setValue];
}

const COUNTRIES_URL = "http://localhost:9000/countries";

/// CONTEXT

const CountryContext = createContext();

function CountryProvider({ children }) {
  const [data, setData] = useState([]);
  const [countryName, setCountryName] = useState("");

  useEffect(function () {
    async function fetchData() {
      try {
        const res = await fetch(COUNTRIES_URL);
        const resJson = await res?.json();
        setData(resJson);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  return (
    <CountryContext.Provider value={{ data, countryName, setCountryName }}>
      {children}
    </CountryContext.Provider>
  );
}

function useCountries() {
  const context = useContext(CountryContext);
  if (context === undefined)
    throw new Error("CountryContext was used outside of CountryProvider");
  return context;
}

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useLocalStorageState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
    "isDarkMode"
  );

  useEffect(
    function () {
      if (isDarkMode) {
        document.documentElement.classList.add("dark-mode");
        document.documentElement.classList.remove("light-mode");
      } else {
        document.documentElement.classList.add("light-mode");
        document.documentElement.classList.remove("dark-mode");
      }
    },
    [isDarkMode]
  );

  function toggleDarkMode() {
    setIsDarkMode((isDark) => !isDark);
    console.log("dark mode activated");
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined)
    throw new Error("DarkModeContext was used outside of DarkModeProvider");
  return context;
}

/****************** ***********************************************************************************************************************/

//APP

export default function App() {
  return (
    <CountryProvider>
      <BrowserRouter>
        <Routes>
          <Route index element={<Navigate replace to="/countries" />} />
          <Route path="*" element={<p>Page not Found...</p>} />
          <Route path="countries" element={<AppLayout />} />
          <Route path="/:countryName" element={<CardPage />} />
        </Routes>
      </BrowserRouter>
    </CountryProvider>
  );
}

function AppLayout() {
  return (
    <div className="App">
      <NavBar />
      <MainContainer />
    </div>
  );
}
function NavBar() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="nav-bar">
      <h1 style={{ fontSize: "2.2rem" }}>Where in the world?</h1>
      <div
        className="change-theme"
        onClick={toggleDarkMode}
        data-theme={isDarkMode ? "dark" : ""}
      >
        <button
          className={`darkmode--btn ${
            isDarkMode ? "darkmode--btn__light" : ""
          }`}
        >
          {isDarkMode ? <HiOutlineSun /> : <HiOutlineMoon />}
        </button>
        <span style={{ fontSize: "1.5rem", fontWeight: "600" }}>
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </span>
      </div>
    </div>
  );
}

function MainContainer() {
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState([]);
  const [region, setRegion] = useState("");

  const { data: country } = useCountries();

  function handleChangeRegion(e) {
    setRegion(e.target.value);
  }

  useEffect(() => {
    const regionsSet = createRegion(country);
    setRegions(regionsSet);
  }, [country]);

  function handleChange(e) {
    e.preventDefault();
    setQuery(e.target.value);
  }

  return (
    <div className="main-container">
      <div className="filter-search">
        <Search res={country} query={query} setChange={handleChange} />
        <DisplayByRegions
          res={country}
          region={region}
          regions={regions}
          selectRegion={handleChangeRegion}
        />
      </div>
      <Cards res={country} query={query} region={region} />
    </div>
  );
}

function Search({ res, query, setChange }) {
  const [onFocus, setIsFocus] = useState(false);
  if (query.length > 0) {
    res.filter((country) => country.name.match(query));
  }

  function handleFocus() {
    setIsFocus(true);
  }

  function handleBlur() {
    setIsFocus(false);
  }

  return (
    <div className="search-div">
      {!onFocus ? <HiSearch /> : ""}
      <input
        type="text"
        placeholder="Search for a country..."
        className="search"
        value={query}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={setChange}
      />
    </div>
  );
}

const createRegion = (regionArr) => {
  const outcome = [];

  for (const item of regionArr) {
    if (!outcome.includes(item.region)) {
      outcome.push(item.region);
    }
  }

  const list = [].concat(outcome);

  return list;
};

function DisplayByRegions({ regions, region, selectRegion }) {
  const [isFocus, setIsFocus] = useState(false);

  function handleIsFocus() {
    setIsFocus(true);
  }

  function handleIsBlur() {
    setIsFocus(false);
  }
  return (
    <select
      value={region}
      onChange={selectRegion}
      className="select-field"
      onFocus={handleIsFocus}
      onBlur={handleIsBlur}
    >
      {!isFocus ? (
        <option value="" disabled>
          Filter By Region
        </option>
      ) : (
        ""
      )}
      {regions.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

function Cards({ res, query, region }) {
  return (
    <div className="cards">
      <Card res={res} region={region} query={query} />
    </div>
  );
}

const CardItem = ({ card, onClick }) => {
  return (
    <div className="card-item" onClick={onClick}>
      <div className="country--image--wrapper">
        <img src={card.flag} alt="countryImage" className="country-image" />
      </div>
      <div className="text-container">
        <h1 className="country-name">{card.name}</h1>
        <p>
          Population: <span>{card.population}</span>
        </p>
        <p>
          Region: <span>{card.region}</span>
        </p>
        <p>
          Capital: <span>{card.capital}</span>
        </p>
      </div>
    </div>
  );
};
function Card({ region, query }) {
  const { data: country, countryName, setCountryName } = useCountries();
  const regions = country?.filter((item) => {
    if (query.length > 0 || region.length > 0) {
      return (
        item.name.toLowerCase().startsWith(query) &&
        item.region.includes(region)
      );
    } else {
      return item;
    }
  });

  const navigate = useNavigate();
  return (
    <div className="card">
      {regions.map((curCountry) => (
        <CardItem
          card={curCountry}
          key={curCountry.name}
          onClick={() => {
            setCountryName(curCountry.name);
            if (countryName) navigate(`/:${countryName}`);
          }}
        />
      ))}
    </div>
  );
}

/** Country Detail */
function CountryDetail() {
  const { data: countries, countryName } = useCountries();
  const curCountry = countries.find((cur) => cur.name === countryName);

  const navigate = useNavigate();

  return (
    <div className="country-details">
      <button onClick={() => navigate(-1)} className="back-btn">
        {" "}
        &larr; Back
      </button>
      {curCountry ? (
        <div className="country-detail">
          <img src={curCountry?.flag} alt={curCountry?.name} />
          <div className="country-properties">
            <h1>{curCountry?.name}</h1>
            <div className="country-properties-details">
              <p>
                Native Name:{" "}
                <span>{curCountry?.nativeName || "Not provided"}</span>
              </p>
              <p>
                Population:{" "}
                <span>{curCountry?.population || "Not provided"}</span>
              </p>{" "}
              <p>
                Region: <span>{curCountry?.region || "Not provided"}</span>
              </p>{" "}
              <p>
                SubRegion:{" "}
                <span>{curCountry?.subregion || "Not provided"}</span>
              </p>{" "}
              <p>
                Capital: <span>{curCountry?.capital || "Not provided"}</span>
              </p>{" "}
              <p>
                Top Level Domain:{" "}
                <span>{curCountry?.topLevelDomain || "Not provided"}</span>
              </p>{" "}
              <p>
                Currencies:{" "}
                <span>
                  {curCountry?.currencies?.map((cur) => cur.name) ||
                    "Not provided"}
                </span>
              </p>{" "}
              <p>
                Languages:{" "}
                <span>
                  {curCountry?.languages?.map((lang) => `${lang.name} `) ||
                    "Not provided"}
                </span>
              </p>
            </div>
            {curCountry.borders && (
              <div className="country-borders">
                <h4>Border Countries: </h4>
                <div className="borders">
                  {curCountry?.borders?.map((borderCountry) => {
                    const matchingCountry = countries.find(
                      (country) => country.alpha3Code === borderCountry
                    );
                    const matchingCountryName = matchingCountry.name;

                    return (
                      <button
                        key={borderCountry}
                        onClick={() => navigate(`/:${matchingCountryName}`)}
                      >
                        {matchingCountry ? matchingCountry.name : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p> Country not found :)</p>
      )}
    </div>
  );
}

/** Pages */

function CardPage() {
  return (
    <div>
      <NavBar />
      <CountryDetail />
    </div>
  );
}

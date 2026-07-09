import type { LocationSeedRecord } from "./shared/location.types.js";

export const countrySeeds: LocationSeedRecord[] = [
  {
    capital: "New Delhi",
    code: "IN",
    countryName: "India",
    currencyCode: "INR",
    dialCode: "+91",
    id: "global-country-in",
    iso2: "IN",
    iso3: "IND",
    name: "India",
    numericCode: "356",
    sortOrder: 1,
    status: "active"
  },
  {
    capital: "Washington, D.C.",
    code: "US",
    currencyCode: "USD",
    dialCode: "+1",
    id: "global-country-us",
    iso2: "US",
    iso3: "USA",
    name: "United States",
    numericCode: "840",
    sortOrder: 20,
    status: "active"
  },
  {
    capital: "London",
    code: "GB",
    currencyCode: "GBP",
    dialCode: "+44",
    id: "global-country-gb",
    iso2: "GB",
    iso3: "GBR",
    name: "United Kingdom",
    numericCode: "826",
    sortOrder: 30,
    status: "active"
  },
  {
    capital: "Abu Dhabi",
    code: "AE",
    currencyCode: "AED",
    dialCode: "+971",
    id: "global-country-ae",
    iso2: "AE",
    iso3: "ARE",
    name: "United Arab Emirates",
    numericCode: "784",
    sortOrder: 40,
    status: "active"
  },
  {
    capital: "Singapore",
    code: "SG",
    currencyCode: "SGD",
    dialCode: "+65",
    id: "global-country-sg",
    iso2: "SG",
    iso3: "SGP",
    name: "Singapore",
    numericCode: "702",
    sortOrder: 50,
    status: "active"
  },
  {
    capital: "Canberra",
    code: "AU",
    currencyCode: "AUD",
    dialCode: "+61",
    id: "global-country-au",
    iso2: "AU",
    iso3: "AUS",
    name: "Australia",
    numericCode: "036",
    sortOrder: 60,
    status: "active"
  }
];

const india = { countryId: "global-country-in", countryName: "India" };

export const stateSeeds: LocationSeedRecord[] = [
  state("-", "-", "global-state-unknown", 0, null, null),
  state("01", "Jammu and Kashmir", "global-state-jammu-kashmir", 1, "JK", "01"),
  state("02", "Himachal Pradesh", "global-state-himachal-pradesh", 2, "HP", "02"),
  state("03", "Punjab", "global-state-punjab", 3, "PB", "03"),
  state("04", "Chandigarh", "global-state-chandigarh", 4, "CH", "04"),
  state("05", "Uttarakhand", "global-state-uttarakhand", 5, "UK", "05"),
  state("06", "Haryana", "global-state-haryana", 6, "HR", "06"),
  state("07", "Delhi", "global-state-delhi", 7, "DL", "07"),
  state("08", "Rajasthan", "global-state-rajasthan", 8, "RJ", "08"),
  state("09", "Uttar Pradesh", "global-state-uttar-pradesh", 9, "UP", "09"),
  state("10", "Bihar", "global-state-bihar", 10, "BR", "10"),
  state("11", "Sikkim", "global-state-sikkim", 11, "SK", "11"),
  state("12", "Arunachal Pradesh", "global-state-arunachal-pradesh", 12, "AR", "12"),
  state("13", "Nagaland", "global-state-nagaland", 13, "NL", "13"),
  state("14", "Manipur", "global-state-manipur", 14, "MN", "14"),
  state("15", "Mizoram", "global-state-mizoram", 15, "MZ", "15"),
  state("16", "Tripura", "global-state-tripura", 16, "TR", "16"),
  state("17", "Meghalaya", "global-state-meghalaya", 17, "ML", "17"),
  state("18", "Assam", "global-state-assam", 18, "AS", "18"),
  state("19", "West Bengal", "global-state-west-bengal", 19, "WB", "19"),
  state("20", "Jharkhand", "global-state-jharkhand", 20, "JH", "20"),
  state("21", "Odisha", "global-state-odisha", 21, "OD", "21"),
  state("22", "Chhattisgarh", "global-state-chhattisgarh", 22, "CG", "22"),
  state("23", "Madhya Pradesh", "global-state-madhya-pradesh", 23, "MP", "23"),
  state("24", "Gujarat", "global-state-gujarat", 24, "GJ", "24"),
  state("26", "Dadra and Nagar Haveli and Daman and Diu", "global-state-dnhdd", 26, "DNHDD", "26"),
  state("27", "Maharashtra", "global-state-maharashtra", 27, "MH", "27"),
  state("29", "Karnataka", "global-state-karnataka", 29, "KA", "29"),
  state("30", "Goa", "global-state-goa", 30, "GA", "30"),
  state("31", "Lakshadweep", "global-state-lakshadweep", 31, "LD", "31"),
  state("32", "Kerala", "global-state-kerala", 32, "KL", "32"),
  state("33", "Tamil Nadu", "global-state-tamil-nadu", 33, "TN", "33"),
  state("34", "Puducherry", "global-state-puducherry", 34, "PY", "34"),
  state("35", "Andaman and Nicobar Islands", "global-state-andaman-nicobar", 35, "AN", "35"),
  state("36", "Telangana", "global-state-telangana", 36, "TS", "36"),
  state("37", "Andhra Pradesh", "global-state-andhra-pradesh", 37, "AP", "37"),
  state("38", "Ladakh", "global-state-ladakh", 38, "LA", "38"),
  state("97", "Other Territory", "global-state-other-territory", 97, "OT", "97")
];

const tamilNadu = {
  ...india,
  stateId: "global-state-tamil-nadu",
  stateName: "Tamil Nadu"
};

export const districtSeeds: LocationSeedRecord[] = [
  district("-", "-", "global-district-unknown", 0),
  ...[
    "Ariyalur",
    "Chengalpattu",
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kallakurichi",
    "Kancheepuram",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Mayiladuthurai",
    "Nagapattinam",
    "Kanniyakumari",
    "Namakkal",
    "Perambalur",
    "Pudukkottai",
    "Ramanathapuram",
    "Ranipet",
    "Salem",
    "Sivaganga",
    "Tenkasi",
    "Thanjavur",
    "Theni",
    "Thoothukudi",
    "Tiruchirappalli",
    "Tirunelveli",
    "Tirupathur",
    "Tiruppur",
    "Tiruvallur",
    "Tiruvannamalai",
    "Tiruvarur",
    "Vellore",
    "Viluppuram",
    "Virudhunagar",
    "The Nilgiris"
  ].map((name, index) => district(codeFromName(name), name, `global-district-${slug(name)}`, index + 1))
];

export const citySeeds: LocationSeedRecord[] = [
  city("-", "-", "global-city-unknown", "global-district-unknown", "-", 0),
  city("CHENNAI", "Chennai", "global-city-chennai", "global-district-chennai", "Chennai", 1),
  city("COIMBATORE", "Coimbatore", "global-city-coimbatore", "global-district-coimbatore", "Coimbatore", 2),
  city("TIRUPPUR", "Tiruppur", "global-city-tiruppur", "global-district-tiruppur", "Tiruppur", 3),
  city("MADURAI", "Madurai", "global-city-madurai", "global-district-madurai", "Madurai", 4),
  city("SALEM", "Salem", "global-city-salem", "global-district-salem", "Salem", 5),
  city("ERODE", "Erode", "global-city-erode", "global-district-erode", "Erode", 6),
  city("TRICHY", "Tiruchirappalli", "global-city-tiruchirappalli", "global-district-tiruchirappalli", "Tiruchirappalli", 7),
  city("TIRUNELVELI", "Tirunelveli", "global-city-tirunelveli", "global-district-tirunelveli", "Tirunelveli", 8),
  city("THOOTHUKUDI", "Thoothukudi", "global-city-thoothukudi", "global-district-thoothukudi", "Thoothukudi", 9),
  city("VELLORE", "Vellore", "global-city-vellore", "global-district-vellore", "Vellore", 10),
  city("HOSUR", "Hosur", "global-city-hosur", "global-district-krishnagiri", "Krishnagiri", 11),
  city("NAGERCOIL", "Nagercoil", "global-city-nagercoil", "global-district-kanniyakumari", "Kanniyakumari", 12),
  city("THANJAVUR", "Thanjavur", "global-city-thanjavur", "global-district-thanjavur", "Thanjavur", 13),
  city("DINDIGUL", "Dindigul", "global-city-dindigul", "global-district-dindigul", "Dindigul", 14),
  city("KARUR", "Karur", "global-city-karur", "global-district-karur", "Karur", 15),
  city("NAMAKKAL", "Namakkal", "global-city-namakkal", "global-district-namakkal", "Namakkal", 16),
  city("CUDDALORE", "Cuddalore", "global-city-cuddalore", "global-district-cuddalore", "Cuddalore", 17),
  city("KANCHIPURAM", "Kancheepuram", "global-city-kancheepuram", "global-district-kancheepuram", "Kancheepuram", 18),
  city("TIRUVALLUR", "Tiruvallur", "global-city-tiruvallur", "global-district-tiruvallur", "Tiruvallur", 19),
  city("UDUMALPET", "Udumalpet", "global-city-udumalpet", "global-district-tiruppur", "Tiruppur", 20),
  city("POLLACHI", "Pollachi", "global-city-pollachi", "global-district-coimbatore", "Coimbatore", 21),
  city("AVINASHI", "Avinashi", "global-city-avinashi", "global-district-tiruppur", "Tiruppur", 22)
];

export const pincodeSeeds: LocationSeedRecord[] = [
  pincode("-", "-", "-", 0),
  pincode("641601", "Tiruppur North", "Tiruppur", 1),
  pincode("641602", "Tiruppur Bazaar", "Tiruppur", 2),
  pincode("641603", "Tiruppur South", "Tiruppur", 3),
  pincode("641604", "Tiruppur Cotton Market", "Tiruppur", 4),
  pincode("641605", "Veerapandi", "Tiruppur", 5),
  pincode("641606", "Vijayapuram", "Tiruppur", 6),
  pincode("641607", "P.N. Road", "Tiruppur", 7),
  pincode("641652", "Avinashi", "Tiruppur", 8),
  pincode("642126", "Udumalpet", "Tiruppur", 9),
  pincode("641001", "Coimbatore Head Post Office", "Coimbatore", 20),
  pincode("641002", "R.S. Puram", "Coimbatore", 21),
  pincode("641004", "Peelamedu", "Coimbatore", 22),
  pincode("641006", "Ganapathy", "Coimbatore", 23),
  pincode("641012", "Tatabad", "Coimbatore", 24),
  pincode("641018", "Race Course", "Coimbatore", 25),
  pincode("641035", "Saravanampatti", "Coimbatore", 26),
  pincode("641041", "Vadavalli", "Coimbatore", 27),
  pincode("642001", "Pollachi", "Coimbatore", 28),
  pincode("600001", "Chennai GPO", "Chennai", 40),
  pincode("600002", "Anna Road", "Chennai", 41),
  pincode("600004", "Mylapore", "Chennai", 42),
  pincode("600017", "T. Nagar", "Chennai", 43),
  pincode("600020", "Adyar", "Chennai", 44),
  pincode("600028", "Raja Annamalaipuram", "Chennai", 45),
  pincode("600032", "Guindy", "Chennai", 46),
  pincode("600042", "Velachery", "Chennai", 47),
  pincode("600100", "Pallikaranai", "Chennai", 48)
];

function state(code: string, name: string, id: string, sortOrder: number, shortCode: string | null, gstStateCode: string | null) {
  return { ...india, code, gstStateCode, id, name, shortCode, sortOrder, status: "active" as const };
}

function district(code: string, name: string, id: string, sortOrder: number) {
  return { ...tamilNadu, code, id, name, sortOrder, status: "active" as const };
}

function city(code: string, name: string, id: string, districtId: string, districtName: string, sortOrder: number) {
  return { ...tamilNadu, code, districtId, districtName, id, name, sortOrder, status: "active" as const };
}

function pincode(code: string, areaName: string, cityName: string, sortOrder: number) {
  return {
    areaName,
    cityName,
    code,
    countryName: "India",
    id: `global-pincode-${slug(code)}`,
    name: code === "-" ? "-" : `${code} - ${areaName}`,
    pincode: code,
    sortOrder,
    stateName: "Tamil Nadu",
    status: "active" as const
  };
}

function codeFromName(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

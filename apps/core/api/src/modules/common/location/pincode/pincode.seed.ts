import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";

export const pincodeSeed = {
  description: "Seed pincodes for supported Tamil Nadu cities.",
  key: "core.common.location.pincode.seed"
};

export async function seedPincodeModule() {
  const rows = await sql<{ id: number; name: string }>`SELECT cities.id, cities.name FROM cities
    INNER JOIN districts ON districts.id = cities.district_id
    INNER JOIN states ON states.id = districts.state_id
    INNER JOIN countries ON countries.id = states.country_id
    WHERE countries.code = 'IN' AND states.name = 'Tamil Nadu'`.execute(getCoreDatabase());
  const cityIds = new Map(rows.rows.map((row) => [row.name, row.id]));

  for (const pincode of pincodeSeeds) {
    const cityId = cityIds.get(pincode.cityName);
    if (!cityId)
      throw new Error(`City seed must exist before pincode seed is applied: ${pincode.cityName}`);
    const uuid = `p${String(pincode.sortOrder).padStart(7, "0")}`;
    const name = pincode.code === "-" ? "-" : `${pincode.code} - ${pincode.areaName}`;
    await sql`INSERT INTO pincodes (uuid, city_id, name, sort_order, status)
      VALUES (${uuid}, ${cityId}, ${name}, ${pincode.sortOrder}, ${pincode.status})
      ON DUPLICATE KEY UPDATE city_id=VALUES(city_id), name=VALUES(name), sort_order=VALUES(sort_order), status=VALUES(status)`.execute(
      getCoreDatabase()
    );
  }
}

const pincodeSeeds = [
  { code: "-", areaName: "-", cityName: "-", sortOrder: 0, status: "active" as const },
  {
    code: "641601",
    areaName: "Tiruppur North",
    cityName: "Tiruppur",
    sortOrder: 1,
    status: "active" as const
  },
  {
    code: "641602",
    areaName: "Tiruppur Bazaar",
    cityName: "Tiruppur",
    sortOrder: 2,
    status: "active" as const
  },
  {
    code: "641603",
    areaName: "Tiruppur South",
    cityName: "Tiruppur",
    sortOrder: 3,
    status: "active" as const
  },
  {
    code: "641604",
    areaName: "Tiruppur Cotton Market",
    cityName: "Tiruppur",
    sortOrder: 4,
    status: "active" as const
  },
  {
    code: "641605",
    areaName: "Veerapandi",
    cityName: "Tiruppur",
    sortOrder: 5,
    status: "active" as const
  },
  {
    code: "641606",
    areaName: "Vijayapuram",
    cityName: "Tiruppur",
    sortOrder: 6,
    status: "active" as const
  },
  {
    code: "641607",
    areaName: "P.N. Road",
    cityName: "Tiruppur",
    sortOrder: 7,
    status: "active" as const
  },
  {
    code: "641652",
    areaName: "Avinashi",
    cityName: "Tiruppur",
    sortOrder: 8,
    status: "active" as const
  },
  {
    code: "642126",
    areaName: "Udumalpet",
    cityName: "Tiruppur",
    sortOrder: 9,
    status: "active" as const
  },
  {
    code: "641001",
    areaName: "Coimbatore Head Post Office",
    cityName: "Coimbatore",
    sortOrder: 20,
    status: "active" as const
  },
  {
    code: "641002",
    areaName: "R.S. Puram",
    cityName: "Coimbatore",
    sortOrder: 21,
    status: "active" as const
  },
  {
    code: "641004",
    areaName: "Peelamedu",
    cityName: "Coimbatore",
    sortOrder: 22,
    status: "active" as const
  },
  {
    code: "641006",
    areaName: "Ganapathy",
    cityName: "Coimbatore",
    sortOrder: 23,
    status: "active" as const
  },
  {
    code: "641012",
    areaName: "Tatabad",
    cityName: "Coimbatore",
    sortOrder: 24,
    status: "active" as const
  },
  {
    code: "641018",
    areaName: "Race Course",
    cityName: "Coimbatore",
    sortOrder: 25,
    status: "active" as const
  },
  {
    code: "641035",
    areaName: "Saravanampatti",
    cityName: "Coimbatore",
    sortOrder: 26,
    status: "active" as const
  },
  {
    code: "641041",
    areaName: "Vadavalli",
    cityName: "Coimbatore",
    sortOrder: 27,
    status: "active" as const
  },
  {
    code: "642001",
    areaName: "Pollachi",
    cityName: "Coimbatore",
    sortOrder: 28,
    status: "active" as const
  },
  {
    code: "600001",
    areaName: "Chennai GPO",
    cityName: "Chennai",
    sortOrder: 40,
    status: "active" as const
  },
  {
    code: "600002",
    areaName: "Anna Road",
    cityName: "Chennai",
    sortOrder: 41,
    status: "active" as const
  },
  {
    code: "600004",
    areaName: "Mylapore",
    cityName: "Chennai",
    sortOrder: 42,
    status: "active" as const
  },
  {
    code: "600017",
    areaName: "T. Nagar",
    cityName: "Chennai",
    sortOrder: 43,
    status: "active" as const
  },
  {
    code: "600020",
    areaName: "Adyar",
    cityName: "Chennai",
    sortOrder: 44,
    status: "active" as const
  },
  {
    code: "600028",
    areaName: "Raja Annamalaipuram",
    cityName: "Chennai",
    sortOrder: 45,
    status: "active" as const
  },
  {
    code: "600032",
    areaName: "Guindy",
    cityName: "Chennai",
    sortOrder: 46,
    status: "active" as const
  },
  {
    code: "600042",
    areaName: "Velachery",
    cityName: "Chennai",
    sortOrder: 47,
    status: "active" as const
  },
  {
    code: "600100",
    areaName: "Pallikaranai",
    cityName: "Chennai",
    sortOrder: 48,
    status: "active" as const
  }
];

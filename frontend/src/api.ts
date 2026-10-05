const API_URL = "http://localhost:5000/api";

export async function getMapData(token: string) {
  const response = await fetch(`${API_URL}/gis/map-data`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.json();
}
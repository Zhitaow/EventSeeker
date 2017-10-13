package external;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;
import entity.Item;

public class GoogleGeoCodeAPI {
	private static final String API_HOST = "maps.googleapis.com";
	private static final String SEARCH_PATH = "/maps/api/geocode/json"; 
	private static final String API_KEY = "AIzaSyAEYvh-e-z8sCLiskg-O8UjSeEL0cnPG_0";

	/**
	 * Creates and sends a request to the TicketMaster API by term and location.
	 */
	public static JSONArray getGeoCode(String address) {
		address = address.trim().replace(',','+').replace(' ','+');
		String url = "https://" + API_HOST + SEARCH_PATH;
		String query = String.format("key=%s&address=%s", API_KEY, address);
		
		try {
			HttpURLConnection connection = (HttpURLConnection) new URL(url + "?" + query).openConnection();
			connection.setRequestMethod("GET");
			int responseCode = connection.getResponseCode();
			System.out.println("\nSending 'GET' request to URL : " + url + "?" + query);
			BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
			String inputLine;
			StringBuilder response = new StringBuilder();
			while ((inputLine = in.readLine()) != null) {
				response.append(inputLine);
			}
			in.close();

			JSONObject responseJson = new JSONObject(response.toString());
			JSONArray results = (JSONArray) responseJson.get("results");
			return results;
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}
	/**
	 * Main entry for sample GeoCode API requests.
	 */
	public static void main(String[] args) {
		JSONArray out = GoogleGeoCodeAPI.getGeoCode("511 Central ave, harrison, nj");
		System.out.println(out);
	}
}

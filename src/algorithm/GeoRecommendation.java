package algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import db.DBConnection;
import db.DBConnectionFactory;
import entity.Item;

// Recommendation based on geo distance and similar categories.
public class GeoRecommendation implements Recommendation {

  @Override
  public List<Item> recommendItems(String userId, double lat, double lon, String radius) {
    DBConnection conn = DBConnectionFactory.getDBConnection();
    // step 1:  db queries
    Set<String> favoriteItems = conn.getFavoriteItemIds(userId); 
    //step 2: create a hash set of all favorite items
    Set<String> allCategories = new HashSet<>(); 
    for (String item : favoriteItems) {
      allCategories.addAll(conn.getCategories(item)); 
    }
    // step 3: for each category, call external API to search nearby events of the same category
    Set<Item> recommendedItems = new HashSet<>(); 
    for (String category : allCategories) {
      List<Item> items = conn.searchItems(userId, lat, lon, category, radius); 
      recommendedItems.addAll(items);
    }
    // step 4: store these events to a list to facilitate ranking sort in step 5
    List<Item> filteredItems = new ArrayList<>(); 
    for (Item item : recommendedItems) {
      if (!favoriteItems.contains(item.getItemId())) {
        filteredItems.add(item);
      }
    }

    // step 5. perform ranking of these items based on distance.
    Collections.sort(filteredItems, new Comparator<Item>() {
      @Override
      public int compare(Item item1, Item item2) {
        double distance1 = getDistance(item1.getLatitude(), item1.getLongitude(), lat, lon);
        double distance2 = getDistance(item2.getLatitude(), item2.getLongitude(), lat, lon);
        // return the increasing order of distance.
        return (int) (distance1 - distance2);
      }
    });

    return filteredItems;
  }

  // Calculate the distances between two geo-locations.
  // Reference : http://andrew.hedges.name/experiments/haversine/
  private static double getDistance(double lat1, double lon1, double lat2, double lon2) {
    double dlon = lon2 - lon1;
    double dlat = lat2 - lat1;
    double a = Math.sin(dlat / 2 / 180 * Math.PI) * Math.sin(dlat / 2 / 180 * Math.PI)
        + Math.cos(lat1 / 180 * Math.PI) * Math.cos(lat2 / 180 * Math.PI)
            * Math.sin(dlon / 2 / 180 * Math.PI) * Math.sin(dlon / 2 / 180 * Math.PI);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Radius of earth in miles.
    double R = 3961;
    return R * c;
  }
}

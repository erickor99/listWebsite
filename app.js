const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// Define the item schema
const itemSchema = new mongoose.Schema({ name: String });
const listSchema = new mongoose.Schema({name: String, items: [itemSchema]});

// Register the item schema as 'Item' model
const Item = mongoose.model('Item', itemSchema);
const List = mongoose.model('List', listSchema);

    const itemsArray = [
      { name: 'welcome to your todolist' },
      { name: 'hit the + button to add a new item' },
      { name: '<-- hit this to delete an item' }
    ];

async function connectToDatabase() {
  try {
      await mongoose.connect("mongodb+srv://erick99:homosapiens668@cluster0.85khbjm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
   // await mongoose.connect("mongodb://localhost:27017/todolistDB");
      
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

async function createInitialItems() {
  try {
    await Item.insertMany(itemsArray); // Use 'Item' model here
    console.log("Initial items inserted successfully");
  } catch (error) {
    console.error("Error inserting initial items:", error);
  }
}

async function main() {
  await connectToDatabase();
  // Create initial items only if no items are found in the database
  const Items = mongoose.model('Item');
  const foundItems = await Items.find({});
  if (foundItems.length === 0) {
    await createInitialItems();
  }
    
    
    
}

main().catch(err => console.error(err));

app.get("/", async function (req, res) {
  try {
    const Items = mongoose.model('Item');
    const foundItems = await Items.find({});
    res.render("list", { listTitle: "Today", newListItems: foundItems });
  } catch (error) {
    console.error("Error retrieving items:", error);
    res.status(500).send("Internal Server Error");
  }
});

/*app.post("/", async function (req, res) {
  const itemName = req.body.newItem;

    
  const item = new Item({
    name: itemName
  });

  try {
    await item.save();
    res.redirect("/");
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(500).send("Internal Server Error");
  }
});*/


app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  try {
    const item = new Item({ name: itemName });

    if (listName === "Today") {
      // Save the item directly if it belongs to the "Today" list
      await item.save();
      res.redirect("/");
    } 
      else {
      // Find the list and update it with the new item
      const foundList = await List.findOne({ name: listName });

      if (!foundList) {
        throw new Error("List not found");
      }

      // Push the new item to the items array of the found list
      foundList.items.push(item);

      // Save the updated list
      await foundList.save();
      res.redirect("/" + listName);
    }
  
  } 
    
    catch (error) {
    console.error("Error saving item:", error);
    res.status(500).send("Internal Server Error");
  }
});




app.post("/delete", async function(req, res) {
    try {
        // Extract the item ID and list name from the request body
        const itemId = req.body.itemId;
        const listName = req.body.listName;
     
        if(listName === "Today") {       
            // Perform the deletion operation for the "Today" list
            const deletedItem = await Item.findByIdAndDelete(itemId);
            
            // Check if the item was successfully deleted
            if (!deletedItem) {
                return res.status(404).send("Item not found");
            }
            
            // Redirect to the root route ("/") after deletion
            res.redirect("/");
        } else {
            // Perform the deletion operation for custom lists
            await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: itemId } } }
            );
            
            // Redirect to the custom list route after deletion
            res.redirect("/" + listName);
        }
    } catch (error) {
        // If an error occurs, log it to the console and respond with an error message
        console.error("Error deleting item:", error);
        res.status(500).send("Internal Server Error");
    }
});




// Define a dynamic route with a route parameter
app.get("/:customListName", async function(req, res) {
  try {
    const customListName = _.capitalize(req.params.customListName);

    // Use await to wait for the findOne query to complete
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      // If list not found, create a new list
      const list = new List({
        name: customListName,
        items: itemsArray
      });

      // Use await to wait for the save operation to complete
      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (error) {
    console.error("Error:", error); // Log the error to the console
    res.status(500).send("Internal Server Error");
  }
});


app.get("/about", function (req, res) {
  res.render("about");
});

//const port = 3000;
app.listen(process.env.PORT || 3000, function () {
  console.log(`Server started on port ${port}`);
});

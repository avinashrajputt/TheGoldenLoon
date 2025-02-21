const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const path = require("path");
const methodoverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const expressError = require("./utils/expressError");
const {listingSchema}= require("./schema");

const MONGO_URL = "mongodb://127.0.0.1:27017/TheGoldenLoon";

main().then(() =>{
    console.log("connected to DB");
}).catch(err => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodoverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.send("Hi, i am root");
    });


//error handling middleware
const validateListing = (req, res, next) => {
  let {error}= listingSchema.validate(req.body);
    if(error){
      let errMsg = error.details.map(el => el.message).join(",");
      throw new expressError(errMsg ,400);
    }else{
      next();
    }
}


//index route
app.get("/listings",wrapAsync(async (req, res) => {
  const allListings= await Listing.find({});
  res.render("listings/index.ejs",{allListings});
}));

//new route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
  });

//show route
app.get("/listings/:id",wrapAsync(async (req, res) => {
  let {id} = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs",{listing});
}
));

//create route
app.post("/listings",validateListing,wrapAsync(async (req, res, next) => {
    const newListing= new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  })
);

//edit route
app.get("/listings/:id/edit",wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
  }
));

//update route
app.put("/listings/:id",validateListing,wrapAsync(async (req, res) => {
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  }
));

//delete route
app.delete("/listings/:id",wrapAsync(async (req, res) => {
    let {id} = req.params;
    let deletedListing= await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");

}));


// app.get("/testListing",async (req,res) => {
//     let sampleListing =new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calanguta, Goa",
//         country: "India"
//     })
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("sucessful testing");
// });

app.all("*", (req, res, next) => {
    next(new expressError("Page not Found!", 404));
});

app.use((err, req, res, next) => {
    let {statusCode=500, message="Something went wrong"} = err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
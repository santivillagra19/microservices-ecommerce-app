db.product.find().forEach(function(p) { 
  if(p.category) {
    p.categorySlug = p.category.toLowerCase().replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u").replace(/ /g, "-"); 
  }
  if(p.brand) {
    p.brandSlug = p.brand.toLowerCase().replace(/ /g, "-").replace(/\+/g, "-"); 
  }
  db.product.updateOne({_id: p._id}, {"$set": {categorySlug: p.categorySlug, brandSlug: p.brandSlug}}); 
});

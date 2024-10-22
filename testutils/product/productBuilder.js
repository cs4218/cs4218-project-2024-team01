export class ProductBuilder {
    constructor() {
        this.product = {
            _id: "123123",
            name: "test",
            price: 100,
            description: "test description",
            category: {
                name: "Test Category",
                _id: "123"
            },
            quantity: 10,
            shipping: true,
        }
    }
    withId(id) {
        this.product._id = id
        return this
    }
    withCategoryId(categoryId) {
        this.product.category._id = categoryId
        return this
    }
    withName(name) {
        this.product.name = name
        return this
    }
    withSlug(slug) {
        this.product.slug = slug
        return this
    }
    withPrice(price) {
        this.product.price = price
        return this
    }
    withDescription(description) {
        this.product.description = description
        return this
    }
    withImage(image) {
        this.product.photo = image
        return this
    }
    withCategory(category) {
        this.product.category = category
        return this
    }
    withQuantity(quantity) {
        this.product.quantity = quantity
        return this
    }
    withShipping(shipping) {
        this.product.shipping = shipping
        return this
    }
    build() {
        return this.product
    }
}
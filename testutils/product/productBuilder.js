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
    withName(name) {
        this.product.name = name
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
        this.product.image = image
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
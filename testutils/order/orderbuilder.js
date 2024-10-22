export class OrderBuilder {
    constructor() {
        this.orderObj = {
            _id: "66efc47fe5c374b4b4ab0f9e",
            products: [],
            payment: {},
            buyer: "51bb793aca2ab77a3200000d",
            status: 'Not Process'
        }
    }
    withId(id) {
        this.orderObj._id = id
        return this
    }
    withProducts(products) {
        this.orderObj.products = products
        return this
    }
    
    withPayment(payment) {
        this.orderObj.payment = payment
        return this
    }
    
    withBuyer(buyer) {
        this.orderObj.buyer = buyer
        return this
    }
    
    withStatus(status) {
        this.orderObj.status = status
        return this
    }
    
    build() {
        return this.orderObj
    }
}
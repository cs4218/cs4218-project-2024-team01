export class OrderBuilder {
    constructor() {
        this.orderObj = {
            products: [],
            payment: {},
            buyer: '123123',
            status: 'Not Process'
        }
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
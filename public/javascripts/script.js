//FORM VALIDATION
// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'

    // Fetch all the forms we want to apply custiom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }

            form.classList.add('was-validated')
        }, false)
    })
})()

//BLOCK USER

function blockUser(userId) {
    swal({
        title: "Are you sure?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "red",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        closeOnConfirm: false,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/admin/users/' + userId,
                    method: 'get',

                    success: (response) => {
                        console.log("HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII");
                        if (response.status) {
                            location.reload();
                        } else {
                            return false
                        }
                    }
                })
            }
        });
}


//EDIT CATGORY

function editCATEGORY(categoryName, categoryId) {

    swal({
        title: "Edit Category!",
        // text: "Write something interesting:",
        type: "input",
        showCancelButton: true,
        closeOnConfirm: true,
        animation: "slide-from-top",
        inputValue: categoryName,
        inputPlaceholder: "Edit Category"
    },
        function (inputValue) {
            if (inputValue === null)
                return false;
            if (inputValue === "") {
                return false
            }
            $.ajax({
                url: '/admin/edit-category',
                method: 'put',
                data: {
                    categoryId,
                    inputValue,
                    categoryName
                },
                success: (response) => {
                    if (response.status) {
                        location.reload();
                    } else {
                        return false
                    }
                }
            })
        });
}


//DELETE CATEGORY

function deleteCategory(catId, catName) {
    swal({
        title: "Are you sure?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "red",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        closeOnConfirm: false,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/admin/delete-category',
                    method: 'delete',
                    data: {
                        catId,
                        catName
                    },
                    success: (response) => {
                        console.log("HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII");
                        if (response.status) {
                            location.reload();
                        } else {
                            return false
                        }
                    }
                })
            }
        });
}

//DELETE PRODUCT
function deleteProduct(prdctId) {
    swal({
        title: "Are you sure?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "red",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        closeOnConfirm: false,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/admin/delete-product',
                    method: 'delete',
                    data: {
                        prdctId
                    },
                    success: (response) => {
                        console.log("HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII");
                        if (response.status) {
                            location.reload();
                        } else {
                            return false
                        }
                    }
                })
            }
        });
}




//ADD PRODUCT
$("#add-product").submit((e) => {
    console.log("start---------------------------------")
    e.preventDefault();
    $.ajax({
        url: '/admin/addProduct',
        method: 'post',
        data: $('#add-product').serialize(),
        success: (response) => {
            console.log("response ==========", response)
            if (response.status) {
                swal("Here's the title!", "...and here's the text!");
            }
        }
    })
})

//ADD TO CART AJAX
function addToCart(prodId) {
    $.ajax({
        url: '/add-to-cart/' + prodId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                console.log("added to cart----------------------")

                let count = $('#cart-count').attr('data-notify')
                count = parseInt(count) + 1
                console.log("cart-count   =======================", count)

                $("#cart-count").attr('data-notify', count)

                swal({
                    title: "Added to cart is successful!",
                    icon: "success",
                }
                );



                //popup
                // document.getElementById('success').classList.remove('d-none')
                // setTimeout(function () {
                //     document.getElementById('success').classList.add('d-none')
                // }, 1000)
            } else {
                location.href = '/login'
            }
        }
    })
}

//ADD TO WISHLIST
function addToWishlist(prodId) {
    $.ajax({
        url: '/add-to-wishlist/' + prodId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                console.log("added to wish list----------------------");

                let count = $('#wish-count').attr('data-notify')
                count = parseInt(count) + 1
                console.log("wish-count   =======================", count)

                $("#wish-count").attr('data-notify', count)
                
                swal({
                    title: "Added to wish list is successful!",
                    icon: "success",
                }
                );
                $('#wish-button').text("Remove From Wishlist");
                $('#wish-button').css('background-color','red');
            } else {
                let count = $('#wish-count').attr('data-notify')
                count = parseInt(count) - 1
                console.log("wish-count   =======================", count)

                $("#wish-count").attr('data-notify', count)
                
                swal({
                    title: "Removed from wish list ",
                    icon: "success",
                }
                );
                $('#wish-button').text("ADD TO Wishlist");
                $('#wish-button').css('background-color','#717fe0');
            }
        }
    })
}

function changeQuantity(cartId, prodId, stock, prodPrice, userId, count) {
    console.log("cartId ======================", cartId);
    console.log("prodId ======================", prodId);
    console.log("userId ======================", userId);
    console.log("stock ======================", stock);
    console.log("count ======================", count);
    console.log("prod price ======================", prodPrice);
    let quantity = parseInt(document.getElementById(prodId).innerHTML)
    let DeliveyCharge=document.getElementById('Delivery-Charges').innerHTML
    let Packing=document.getElementById('Secured-Packaging-Fee').innerHTML
    DeliveyCharge=DeliveyCharge.substring(DeliveyCharge.indexOf('₹') + 1);
    Packing=Packing.substring(Packing.indexOf('₹') + 1);
    
    count = parseInt(count)
    console.log(quantity);
    quantityCheck = quantity + count
    console.log(quantityCheck);
    stock = parseInt(stock)
    prodPrice = parseInt(prodPrice)
    if (quantityCheck <= stock && quantityCheck != 0) {
        document.getElementById("minus" + prodId).classList.remove("invisible")
        document.getElementById("plus" + prodId).classList.remove("invisible")
        $.ajax({
            url: '/change-product-quantity',
            data: {
                user: userId,
                cart: cartId,
                product: prodId,
                count: count,
                quantity: quantity
            },
            type: 'post',
            success: (response) => {
                console.log(response);
                if (response.removeProduct) {
                    location.reload()
                } else {
                    document.getElementById('Discount').innerHTML='-₹0';
                    document.getElementById(prodId).innerHTML = quantity + count;
                    document.getElementById('TotalProdctPrice' + prodId).innerHTML = '₹' + ((quantity + count) * prodPrice);
                    document.getElementById('total').innerHTML = '₹' + response.total;
                    document.getElementById('GrantTotal').innerHTML = '₹' + (response.total+parseInt(DeliveyCharge)+parseInt(Packing));
                }
            }
        })
    }
    if (quantityCheck == 1) {
        document.getElementById("minus" + prodId).classList.add("invisible")
    }
    if (quantityCheck == stock) {
        document.getElementById("plus" + prodId).classList.add("invisible")
    }
}

function deleteCart(prodId) {
    console.log("prodId------------", prodId)
    swal({
        title: "Are you sure?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "red",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        closeOnConfirm: false,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/delete-cart-product/' + prodId,
                    method: 'get',
                    success: (response) => {
                        if (response) {
                            location.reload()
                        }
                    }
                })
            }
        }
    );
}

$("#checkout-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            if (response.codSuccess) {
                swal({
                    title: "Order Placed ",
                    type: 'success',
                    text: "congratulations!! ",
                    icon: "success",
                    confirmButtonColor: "#318a2c",
                    confirmButtonText: "Click here to See the Orders!",
                    closeOnConfirm: false
                },
                    function (isConfirm) {
                        if (isConfirm) {
                            location.href = '/orders'
                        }
                    });
            }
            else if (response.razorpay) {
                console.log("u r in razorpay ");
                razorpayPayment(response.response)
            }
            else if (response.paypal) {
                location.href = response.url
            }
        }
    })
})

function razorpayPayment(order) {
    var options = {
        "key": "rzp_test_2ZIIwvfrPDUn5c", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Shopiko",
        "description": "Test Transaction",
        "image": src = "/images/istockphoto-1266252971-612x612.jpg" ,
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
            verifyPayment(response, order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function verifyPayment(payment, order) {
    console.log();
    $.ajax({
        url: '/verify-payment',
        data: {
            payment, order
        },
        method: 'post',
        success: (respone) => {
            console.log("respone ============",respone);
            if (respone.status) {
                location.href = '/orders'
            } else {
                alert("Payment Failed")
            }
        }
    })
}

//USER ORDER CANCEL
function cancelOrder(orderId, prodId) {
    swal({
        title: "Are you sure?",
        text: "Do you want to cancel the order",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, Cancel my order",
        cancelButtonText: "No, cancel please!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/cancel-order',
                    method: 'put',
                    data: {
                        orderId,
                        prodId
                    },
                    success: (response) => {
                        if (response.status) {
                            location.reload()
                        }
                    }
                })
            }
        }
    );
}


//USER ORDER CANCEL
function cancelOrder(orderId, prodId) {
    swal({
        title: "Are you sure?",
        text: "Do you want to cancel the order",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, Cancel my order",
        cancelButtonText: "No, cancel please!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/cancel-order',
                    method: 'put',
                    data: {
                        orderId,
                        prodId
                    },
                    success: (response) => {
                        if (response.status) {
                            location.reload()
                        }
                    }
                })
            }
        }
    );
}

function deleteAddress(addressId) {
    console.log("addressId------------", addressId)
    swal({
        title: "Are you sure?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "red",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        closeOnConfirm: false,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/delete-address/' + addressId,
                    method: 'get',
                    success: (response) => {
                        if (response) {
                            location.reload()
                        }
                    }
                })
            }
        }
    );
}

//CATEGORY WISE SORTING
function sortCategory(category) {
    $.ajax({
        url: '/add-to-cart/' + prodId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                console.log("added to cart----------------------")

                let count = $('#cart-count').attr('data-notify')
                count = parseInt(count) + 1
                console.log("cart-count   =======================", count)

                $("#cart-count").attr('data-notify', count)

                swal({
                    title: "Good job!",
                    text: "Added to cart is successful!",
                    icon: "success",
                }
                );



                //popup
                // document.getElementById('success').classList.remove('d-none')
                // setTimeout(function () {
                //     document.getElementById('success').classList.add('d-none')
                // }, 1000)
            } else {
                location.href = '/login'
            }
        }
    })
}



//IMAGE ZOOM
$(document).ready(function () {
    $(".block__pic").imagezoomsl({
        zoomrange: [2, 2]
    });
});

//ADMIN ORDER STATUS
function statusChange(prodId, orderId, status) {
    var status = document.getElementById(prodId + orderId).value;
    swal({
        title: "Are you sure?",
        text: "Do you want to " + status + " the order",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Yes, " + status + " it!",
        cancelButtonText: "No!",
        closeOnConfirm: true,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/admin/order-status',
                    data: {
                        prodId,
                        orderId,
                        status
                    },
                    method: 'post',
                    success: (response) => {
                        console.log("response *************", response)
                        if (response.status) {
                            console.log("status *************", status)
                            console.log("id *************", orderId, "----------", prodId)
                            document.getElementById(prodId + orderId).innerHTML = status
                            if (status == 'pending' || status == 'placed' || status == 'shipped' || status == 'delivered' || status == 'canceled') {
                                location.reload()
                            }
                        }
                    }
                })
            } else {
                location.reload()
            }
        }
    );
}


//DASHBOARD CHART
window.addEventListener('load', () => {
    console.log("hiiiiihhhh");
    histogram(1, 'daily')
})

function histogram(days, buttonId) {

    $.ajax({
        url: '/admin/dashboard/' + days,
        method: 'get',
        success: (response) => {
            if (response) {
                const buttons = document.querySelectorAll('button');
                buttons.forEach(button => {
                    button.classList.remove('active');
                });
                document.getElementById(buttonId).classList.add("active");

                let totalOrder = response.deliveredOrders + response.shippedOrders + response.placedOrders

                document.getElementById('totalOrders').innerHTML = totalOrder
                document.getElementById('placedOrders').innerHTML = response.placedOrders
                document.getElementById('deliveredOrders').innerHTML = response.deliveredOrders
                document.getElementById('totalAmount').innerHTML = response.totalAmount

                var xValues = ["Delivered", "Shipped", "Placed", "Pending", "Canceled"];
                var yValues = [response.deliveredOrders, response.shippedOrders, response.placedOrders, response.pendingOrders, response.canceledOrders];
                var barColors = ["green", "blue", "orange", "brown", "red"];

                new Chart("order", {
                    type: "bar",
                    data: {
                        labels: xValues,
                        datasets: [{
                            backgroundColor: barColors,
                            data: yValues
                        }]
                    },
                    options: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: "Order Report"
                        }
                    }

                });


                var xValues = ["COD", "PAYPAL", "RAZORPAY"];
                var yValues = [response.codTotal, response.onlineTotal,response.RazorpayTotal];

                var barColors = [
                    "#b91d47",
                    "#00aba9",
                    "#FFFF00"
                ];

                new Chart("payment", {
                    type: "pie",
                    data: {
                        labels: xValues,
                        datasets: [{
                            backgroundColor: barColors,
                            data: yValues
                        }]
                    },
                    options: {
                        title: {
                            display: true,
                            text: "Payment Report"
                        }
                    }
                });
            }
        }
    })
}

//DELETE PRODUCT OFFER
function deleteProductOffer(prodId) {
    $.ajax({
        url: '/admin/offer/delete-product-offer/' + prodId,
        type: 'post',
        success: (response) => {
            swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "red",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                closeOnConfirm: false,
                closeOnCancel: true
            },
                function (isConfirm) {
                    if (isConfirm) {
                        location.reload()
                    }
                }
            )
        }
    })
}

//DELETE CATEGORY OFFER
function deleteCategoryOffer(category) {
    $.ajax({
        url: '/admin/offer/delete-category-offer/',
        type: 'post',
        data: ({ category }),
        success: (response) => {
            swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "red",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                closeOnConfirm: false,
                closeOnCancel: true
            },
                function (isConfirm) {
                    if (isConfirm) {
                        location.reload()
                    }
                }
            )
        }
    })
}

//ADD COUPON
$("#addCoupon").submit((e) => {
    e.preventDefault();
    $.ajax({
        url: '/admin/add-coupon',
        method: 'post',
        data: $("#addCoupon").serialize(),
        success: (response) => {
            if (response.status) {
                location.reload()
            } else {
                swal({
                    title: "There is Already a Coupon....!",
                    text: "Your will not be able to create an existing COUPON",
                    type: "warning",
                    confirmButtonColor: "red",
                    confirmButtonClass: "btn-danger",
                    confirmButtonText: "Ok",
                    closeOnConfirm: true
                })
            }
        }
    })
})

//DELETE COUPON
function deleteCoupon(coupon) {
    $.ajax({
        url: '/admin/delete-coupon/',
        type: 'post',
        data: ({ coupon }),
        success: (response) => {
            swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "red",
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                closeOnConfirm: false,
                closeOnCancel: true
            },
                function (isConfirm) {
                    if (isConfirm) {
                        location.reload()
                    }
                }
            )
        }
    })
}

//REDEEM COUPON
$('#redeem-coupon').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/redeem-coupon',
        method: 'post',
        data: $('#redeem-coupon').serialize(),
        success: (response) => {
            console.log("response ***********************",response);
            if (!response.Msg) {
                $('#coupon-condition').text("Coupen added Successfully")
                $('#coupon-condition-Err').text("")
                $('#coupon-form').css('border-color', 'green')
                document.getElementById('coupon-form').innerHTML = '' ;
                document.getElementById('Discount').innerHTML = '-₹' + response.offer;
                $('#Discount-value').val(response.offer)
                let a=document.getElementById('GrantTotal').innerHTML
                a=a.substring(a.indexOf('₹') + 1);
                let b=parseInt(a) - response.offer
                document.getElementById('GrantTotal').innerHTML = '₹' + b;
                
            } else if(response.Msg.msg=="It's already Used"){
                //location.reload()
                swal({
                    title: "Sorry!",
                    text: "It's already Used!",
                    icon: "success",
                },
                function (isConfirm) {
                    if (isConfirm) {
                        location.reload()
                    }
                }
                );
                
                // $('#coupon-condition-Err').text(response.Msg.msg)
                // $('#coupon-condition').text("")
                // $('#coupon-form').css('border-color', 'red')
                // document.getElementById('coupon-form').innerHTML = '' ;
                // document.getElementById('Discount').innerHTML = '-₹' + 0;
                
            }else {
                if(response.Msg.msg != null)
                    $('#coupon-condition-Err').text(response.Msg.msg)
                else
                    $('#coupon-condition-Err').text(response.Msg)
                $('#coupon-condition').text("")
                $('#coupon-form').css('border-color', 'red')
                document.getElementById('coupon-form').innerHTML = '' ;
                document.getElementById('Discount').innerHTML = '-₹' + 0;
            }
        }
    })
})

function returnProduct(orderId, prodId) {
    swal({
        title: "What is the Reason..?",
        type: "input",
        showCancelButton: true,
        closeOnConfirm: true,
        animation: "slide-from-top",
        inputPlaceholder: "Please share with Us..."
    },
        function (inputValue) {
            if (inputValue === null)
                return false;
            if (inputValue === "") {
                return false
            }
            $.ajax({
                url: '/return-product',
                method: 'post',
                data: {
                    orderId,
                    prodId,
                },
                success: (response) => {
                    if (response.status) {
                        location.href = '/orders'
                    } else {
                        return false
                    }
                }
            })
        });
}

//PDF AND EXCEL
$(document).ready(function ($) {
    $(document).on('click', '.btn_print', function (event) {
        event.preventDefault();
        var element = document.getElementById('container_content');

        let randomNumber = Math.floor(Math.random() * (10000000000 - 1)) + 1;

        var opt =
        {
            margin: 0,
            filename: 'pageContent_' + randomNumber + '.pdf',
            html2canvas: { scale: 10 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });
});

function export_data() {
    let data = document.getElementById('container_content');
    var fp = XLSX.utils.table_to_book(data, { sheet: 'vishal' });
    XLSX.write(fp, {
        bookType: 'xlsx',
        type: 'base64'
    });
    XLSX.writeFile(fp, 'test.xlsx');
}

function deleteWishList(prodId) {
    console.log("prodId------------", prodId)
    swal({
        title: "Are you sure?",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "red",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        closeOnConfirm: false,
        closeOnCancel: true
    },
        function (isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: '/delete-wish-product/' + prodId,
                    method: 'get',
                    success: (response) => {
                        if (response) {
                            location.reload()
                        }
                    }
                })
            }
        }
    );
}

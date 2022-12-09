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

                $("#cart-count").attr('data-notify',count)

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


function changeQuantity(cartId, prodId, stock, prodPrice, userId, Extra, count) {
    console.log("cartId ======================", cartId);
    console.log("prodId ======================", prodId);
    console.log("userId ======================", userId);
    console.log("stock ======================", stock);
    console.log("count ======================", count);
    console.log("prod price ======================", prodPrice);
    let quantity = parseInt(document.getElementById(prodId).innerHTML)
    count = parseInt(count)
    console.log(quantity);
    quantityCheck = quantity + count
    console.log(quantityCheck);
    stock = parseInt(stock)
    prodPrice = parseInt(prodPrice)
    Extra = parseInt(Extra)
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
                    document.getElementById(prodId).innerHTML = quantity + count;
                    document.getElementById('TotalProdctPrice' + prodId).innerHTML = '₹' + ((quantity + count) * prodPrice);
                    document.getElementById('total').innerHTML = '₹' + response.total;
                    document.getElementById('GrantTotal').innerHTML = '₹' + (Extra + response.total);
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
            // else if (response.razorpay) {
            //     razorpayPayment(response.response)
            // }
            // else if (response.paypal) {
            //     location.href = response.url
            // }
        }
    })
})

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

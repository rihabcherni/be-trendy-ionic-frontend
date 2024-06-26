import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { interval } from 'rxjs';
import { Product } from 'src/app/models/Product';
import { CartService } from 'src/app/services/cart/cart.service';
import { FavoriteService } from 'src/app/services/favorite/favorite.service';
import { ApiService } from 'src/app/services/global/api.service';
import { formatDiscount, logout } from 'src/app/utilities';
import Swiper from 'swiper';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss','./dashboard2.component.scss'],
})
export class DashboardComponent  implements OnInit {
  randomOffer: any;
  @ViewChild('swiper')
  swiperRef: ElementRef | undefined;
  swiper?: Swiper;
  segmentList: Array<string> = [];
  selectedSegment: string = '';
  categories: any[] = [];
  subcategories: any[] = [];
  filteredProducts: any[] = [];
  searchQuery: string = '';
  selectedCategory: any;
  selectedSubcategory: any;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private http: HttpClient,
    private cartService: CartService,
    private apiService: ApiService,
    private favoriteService: FavoriteService) {
    }
    ngOnInit() {
      this.updateBadgeCount2()
      this.cartService.cartItemCount$.subscribe(count => {
        this.cartItemCount2 = count;
      });

      this.updateFavoriteBadgeCount2()
      this.favoriteService.favoriteItemCount$.subscribe(count => {
        this.favoriteItemCount2 = count;
      });
    this.fetchCategories();
    this.getRandomOffer();
    interval(5000).subscribe(() => {
      this.getRandomOffer();
    });
    if (!localStorage.getItem('cartItems')) {
      localStorage.setItem('cartItems', '[]');
    }
    if (!localStorage.getItem('favoriteItems')) {
      localStorage.setItem('favoriteItems', '[]');
    }
  }
  logout() {
    this.router.navigate(['/login']);
    logout();
  }
  apiUrl = this.apiService.getApiUrl();

  offers = [
    { id: 1, name: '20% off on all electronics', discount: 20 },
    { id: 2, name: 'Buy one, get one free on selected items', discount: 50},
    { id: 3, name: 'Free shipping on orders over $50', discount: 100},
    { id: 4, name: 'Bundle deal: Save 20% on a laptop and keyboard', discount: 20},
    { id: 5, name: 'Flash sale: 30% off on all clothing items', discount: 30 },
    { id: 6, name: 'Exclusive 10% off for Gold members', discount: 10 },
    { id: 7, name: 'Use code SPRING2 to get 5% off your next order', discount: 5 }
  ];

  toggleItem(product: any) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existingItemIndex = cartItems.findIndex((item: any) => item.id === product.id);
    if (existingItemIndex !== -1) {
      product.quantity = cartItems[existingItemIndex].quantity;
    } else {
      product.quantity = 1;
    }
    this.addToCart(product);
  }
  addToCart(product: any) {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existingItemIndex = cartItems.findIndex((item: any) => item.id === product.id);
    if (existingItemIndex !== -1) {
      cartItems[existingItemIndex].quantity += 1;
    } else {
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        rating:  product.total_reviews > 0 ?
          (product.total_ratings / product.total_reviews % 1 !== 0 ?
            (product.total_ratings / product.total_reviews).toFixed(2) :
            (product.total_ratings / product.total_reviews)) :
            0 ,
        discount: product.discount,
        total_reviews: product.total_reviews,
        image: product.image,
        brand: product.brand,
        quantity: 1 });
    }
    const updatedCartItems = cartItems.filter((item: { quantity: number; }) => item.quantity !== 0);
    localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
    this.updateBadgeCount();
  }
  updateBadgeCount() {
    const totalQuantity = this.cartService.calculateTotalQuantity();
    this.cartService.updateCartItemCount(totalQuantity);
  }
  incrementItem(product: any) {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existingItemIndex = cartItems.findIndex((item: any) => item.id === product.id);

    if (existingItemIndex !== -1) {
      cartItems[existingItemIndex].quantity += 1;
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
    product.quantity=cartItems[existingItemIndex].quantity;
    this.updateBadgeCount();
  }
  decrementItem(product: any) {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existingItemIndex = cartItems.findIndex((item: any) => item.id === product.id);
    if (existingItemIndex !== -1 && cartItems[existingItemIndex].quantity > 0) {
      cartItems[existingItemIndex].quantity -= 1;
      if (cartItems[existingItemIndex].quantity === 0) {
        cartItems.splice(existingItemIndex, 1);
      }
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
    product.quantity = cartItems[existingItemIndex] ? cartItems[existingItemIndex].quantity : 0;
    this.updateBadgeCount();
  }
  updateFavoriteBadgeCount() {
    const totalQuantity = this.favoriteService.calculateTotalQuantity();
    this.favoriteService.updateFavoriteItemCount(totalQuantity);
  }
  toggleFavorite(product: Product): void {
      if (this.favoriteService.isInFavorites(product)) {
        this.favoriteService.removeFromFavorites(product);
      } else {
        this.favoriteService.addToFavorites(product);
      }
      this.updateFavoriteBadgeCount();
  }

  getRandomOffer(): void {
    const randomIndex = Math.floor(Math.random() * this.offers.length);
    this.randomOffer = this.offers[randomIndex];
  }
  fetchCategories() {
    this.http.get<any[]>(this.apiUrl+'/api/products/categories/')
      .subscribe(categories => {
        this.categories = categories.map(category => ({
          name: category.name,
          subcategories: category.subcategories.map((subcategory: any) => ({
            ...subcategory,
            products: []
          }))
        }));
        this.categories.unshift({ name: 'All', subcategories: [] });
        this.segmentList = this.categories.map(category => category.name);
        this.selectedSegment = this.segmentList[0];
        this.selectProductCategory(this.selectedSegment);
        this.fetchSubCategories(this.selectedSegment);
      });
  }

  fetchSubCategories(categoryName: string) {
    const url = this.apiUrl+`/api/products/subcategories/${categoryName}`;
    this.http.get<any[]>(url)
      .subscribe(subcategories => {
        this.subcategories = subcategories.map(subcategory => ({
          name: subcategory.name,
          image: this.apiUrl+`${subcategory.image}`
        }));
        if(categoryName!== 'All'){
          this.subcategories.unshift({ name: 'All', products: [] });
        }else{
          this.subcategories=[];
        }
        this.segmentList = this.subcategories.map(subcategory => subcategory.name);
        this.selectedSegment = this.segmentList[0];
        this.selectSubCategory(this.selectedSegment);
      });
  }

  selectSubCategory(subcategoryName: string) {
    this.selectedSegment = subcategoryName;
    this.filterProducts(this.selectedCategory, subcategoryName);
  }

  selectProductCategory(categoryName: string) {
    this.selectedSegment = categoryName;
    this.selectedCategory = categoryName;
    this.fetchSubCategories(categoryName);
    this.filterProducts(categoryName, 'All');
  }

  filterProducts(categoryName: string, subcategoryName: string) {
    let url="";
    if (categoryName === 'All') {
      this.http.get<any[]>(this.apiUrl+'/api/products/products/')
      .subscribe(products => {
        this.filteredProducts = products.map(product => ({
          ...product,
          quantity: 0
        }));
      });
    } else {
      if(subcategoryName==='All'){
        url = this.apiUrl+`/api/products/product/${categoryName}/`;
     }else if(subcategoryName===''){
        url = this.apiUrl+`/api/products/product/${categoryName}/`;
     }else{
         url = this.apiUrl+`/api/products/product/${categoryName}/${subcategoryName}/`;
      }
      this.http.get<any[]>(url)
        .subscribe(products => {
          this.filteredProducts = products.map(product => ({
            ...product,
            image: `${product.image}`
          }));
        });
    }
}
  formatDiscount(discount: any): string {
    return formatDiscount(discount);
  }
  goBack() {
    this.router.navigateByUrl('/');
  }

  searchProducts(event: any) {
    console.log('Searching products for:', this.searchQuery);
  }
  swiperReady() {
    this.swiper = this.swiperRef?.nativeElement.swiper;
  }

  swiperSlideChanged(e: any) {
    const index = e.target.swiper.activeIndex
    this.selectedSegment = this.segmentList[index]
  }

  _segmentSelected(index: number) {
    this.swiper?.slideTo(index)
  }

  openProductDetails(productId: number) {
    this.router.navigate(['/product-details', productId]);
  }
  openCategory() {
    this.router.navigate(['/store/categories']);
  }

  cartItemCount2: number=0;
  favoriteItemCount2: number=0;
  openFavorite() {
    this.router.navigateByUrl('/client/favorite');
  }
  openCart() {
    this.router.navigateByUrl('/client/cart');
  }

  updateBadgeCount2() {
    const totalQuantity = this.cartService.calculateTotalQuantity();
    this.cartService.updateCartItemCount(totalQuantity);
  }
  updateFavoriteBadgeCount2() {
    const totalQuantity = this.favoriteService.calculateTotalQuantity();
    this.favoriteService.updateFavoriteItemCount(totalQuantity);
  }
  isWelcomeRoute(): boolean {
    return this.router.url.includes('/reset-password');
  }
}



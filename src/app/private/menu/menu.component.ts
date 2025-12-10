import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { Product } from '../../interfaces/product.model';
import { Ingredient } from '../../interfaces/ingredient.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    RouterLink,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  private _provider: ProviderService = inject(ProviderService)
  public _order: OrderService = inject(OrderService)

  menu: Product[] = [];

  async ngOnInit() {
    this.menu = await this._provider.request('GET', 'menu/viewIngredients');
  }

  filterByCategory(id_category: string): Product[] {

    return this.menu.filter(
      (product: Product) => product.category_idcategory == id_category
    );
  }

  filterByProduct(id_product: string): Product {

    return (
      this.menu.find((product: Product) => product.idproducts == id_product) ||
      ({} as Product)
    );
  }

  filterByIngredient(
    key: 'required' | 'extra',
    value: 0 | 1,
    ingredients: Ingredient[] | undefined,
    idproduct: string,
    amount: number
  ): Ingredient[] | undefined {
    const type = value == 0 ? 1 : 0;

    return ingredients?.filter(
      (ingredient: Ingredient) =>
        ingredient[key] == value &&
        !this.filterExtraExceptions(idproduct, amount, type).includes(
          ingredient.idingredients
        )
    );
  }

  addProduct(
    products_idproducts: string,
    price: number,
    name: string,
    name_category: string
  ) {
    (this._order.formOrder.controls['order_details'] as FormArray).push(
      this._order.orderDetails(products_idproducts, price, name, name_category)
    );
  }

  removeProduct(idproduct: string) {
    const index = this._order.formOrder.controls[
      'order_details'
    ].value.findIndex(
      (product: any) => product.products_idproducts == idproduct
    );
    if (index != -1)
      (this._order.formOrder.controls['order_details'] as FormArray).removeAt(
        index
      );
  }

  addIngredient(
    idproduct: string,
    idingredient: string,
    type: 0 | 1,
    event: any,
    amount: number,
    name: string,
    price: number
  ) {

    const index = this._order.formOrder.controls[
      'order_details'
    ].value.findIndex(
      (product: any) =>
        product.products_idproducts == idproduct && product.amount == amount
    );
    if (event) {
  
      (
        (
          (this._order.formOrder.controls['order_details'] as FormArray).at(
            index
          ) as FormGroup
        ).controls['not_ingredient'] as FormArray
      ).push(this._order.notIngredients(idingredient, type, name, price));
    } else {
  
      const indexIngredient = (
        (this._order.formOrder.controls['order_details'] as FormArray).at(
          index
        ) as FormGroup
      ).controls['not_ingredient'].value.findIndex(
        (ingredient: any) =>
          ingredient.ingredients_idingredients == idingredient
      );
      if (indexIngredient != -1)
        (
          (
            (this._order.formOrder.controls['order_details'] as FormArray).at(
              index
            ) as FormGroup
          ).controls['not_ingredient'] as FormArray
        ).removeAt(indexIngredient);
    }
  }

  filterExtraExceptions(
    idproduct: string,
    amount: number,
    type: 0 | 1
  ): string[] {
    const index = this._order.formOrder.controls[
      'order_details'
    ].value.findIndex(
      (product: any) =>
        product.products_idproducts == idproduct && product.amount == amount
    );

    return (
      (
        (this._order.formOrder.controls['order_details'] as FormArray).at(
          index
        ) as FormGroup
      ).controls['not_ingredient'] as FormArray
    ).value
      .filter((ingredient: any) => ingredient.type == type)
      .map((ingredient: any) => ingredient.ingredients_idingredients);
  }

  amount(id: string): number {
    return this._order.formOrder.controls['order_details'].value.filter(
      (product: any) => product.products_idproducts == id
    ).length;
  }

  orderDetailsArray() {
    return this._order.formOrder.controls['order_details'] as FormArray;
  }

  ingredientsSelected(index: number, type: 0 | 1, name: string) {
    return (
      (this.orderDetailsArray().at(index) as FormGroup)?.controls[
        'not_ingredient'
      ] as FormArray
    )?.value
      ?.map((ingredientSelected: any) => {
        if (ingredientSelected.type == type) return ingredientSelected.name;
        return;
      })
      .filter((id: any) => id != undefined)
      .includes(name);
  }

  orderEmpty() {
    return this.orderDetailsArray()
      .value.map((order: any) => Object.values(order))
      .flat()
      .filter((item: any) => !Array.isArray(item))
      .every((item: any) => item == null);
  }
}
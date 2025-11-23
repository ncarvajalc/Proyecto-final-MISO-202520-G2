import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

console.log('[RECOMMENDED PRODUCTS SERVICE] Using API URL:', API_URL);

export interface RecommendedProduct {
  product_id: number;
  product_name: string;
  current_unit_price: string;
  total_quantity_sold: number;
  institutions: string;
  url_imagen: string;
}

export interface RecommendedProductsResponse {
  items: RecommendedProduct[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}


const SAMPLE_RECOMMENDED_PRODUCTS: RecommendedProduct[] = [
    {
      product_id: 1024,
      product_name: "Jeringa Desechable 10ml",
      current_unit_price: "0.45",
      total_quantity_sold: 15000,
      institutions: "Hospital Central, Clínica Santa María, Centro de Salud Sur",
      url_imagen: "https://cdn.pixabay.com/photo/2020/12/16/05/04/medical-5835701_1280.jpg"
    },
    {
      product_id: 2088,
      product_name: "Guantes de Látex (Caja 100u)",
      current_unit_price: "12.99",
      total_quantity_sold: 9800,
      institutions: "Hospital Central, Laboratorio Nacional",
      url_imagen: "https://www.reproalba.com/reproalba2/resources/shop/1/12/243/655o.png"
    },
    {
      product_id: 1015,
      product_name: "Mascarilla Quirúrgica Tipo IIR",
      current_unit_price: "0.15",
      total_quantity_sold: 12500,
      institutions: "Clínica Santa María, Farmacias Reunidas",
      url_imagen: "https://img.medicalexpo.es/images_me/photo-mg/128640-15941184.jpg"
    }
];

const JSON_RESPONSE = {
        items: SAMPLE_RECOMMENDED_PRODUCTS,
        total: SAMPLE_RECOMMENDED_PRODUCTS.length,
        page: 1,
        limit: SAMPLE_RECOMMENDED_PRODUCTS.length,
        total_pages: 1
      }

class RecomendedProductService  {
  async getRecommendedProducts(page: number = 1, limit: number = 10): Promise<RecommendedProductsResponse> {
    try {
      const fullUrl = `${API_URL}/pedidos/productos/mas-comprados`;
      console.log('[RECOMMENDED PRODUCTS SERVICE] Making request to:', fullUrl);
      console.log('[RECOMMENDED PRODUCTS SERVICE] With params:', { page, limit });

      const response = await axios.get<RecommendedProductsResponse>(fullUrl, {
        params: { page, limit }
      });

      if (response.data.total === 0) {
        return JSON_RESPONSE
      }

      console.log('[RECOMMENDED PRODUCTS SERVICE] Response received successfully');
      return response.data;
    } catch (error) {
      console.error('[RECOMMENDED PRODUCTS SERVICE] Error fetching recommended products:', error);
      if (axios.isAxiosError(error)) {
        console.error('[RECOMMENDED PRODUCTS SERVICE] Error config:', error.config);
        console.error('[RECOMMENDED PRODUCTS SERVICE] Error response:', error.response);
        console.error('[RECOMMENDED PRODUCTS SERVICE] Error message:', error.message);
      }

      return JSON_RESPONSE;
    }
  }

  async getClientesMasCompradores(page: number = 1, limit: number = 10): Promise<RecommendedProductsResponse> {
    try {
      const fullUrl = `${API_URL}/pedidos/clientes/mas-compradores`;
      console.log('[RECOMMENDED PRODUCTS SERVICE] Making request to:', fullUrl);
      console.log('[RECOMMENDED PRODUCTS SERVICE] With params:', { page, limit });

      const response = await axios.get<RecommendedProductsResponse>(fullUrl, {
        params: { page, limit }
      });

      if (response.data.total === 0) {
        return JSON_RESPONSE
      }

      console.log('[RECOMMENDED PRODUCTS SERVICE] Response received successfully');
      return response.data;
    } catch (error) {
      console.error('[RECOMMENDED PRODUCTS SERVICE] Error fetching recommended products:', error);
      if (axios.isAxiosError(error)) {
        console.error('[RECOMMENDED PRODUCTS SERVICE] Error config:', error.config);
        console.error('[RECOMMENDED PRODUCTS SERVICE] Error response:', error.response);
        console.error('[RECOMMENDED PRODUCTS SERVICE] Error message:', error.message);
      }

      return JSON_RESPONSE;
    }
  }

}

export const recommendedProductsService = new RecomendedProductService();
import { FC } from "react";
import Layout from "@/components/layout";

const Product: FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Our Products</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add product cards or content here */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Product 1</h2>
            <p className="text-gray-600 mb-4">
              Description of product 1 and its features.
            </p>
            <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
              Learn More
            </button>
          </div>
          {/* Add more product cards as needed */}
        </div>
      </div>
    </Layout>
  );
};

export default Product;
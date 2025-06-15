
import React from 'react';

const IsometricBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none opacity-30 overflow-hidden z-0">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[1200px] h-[700px] transform scale-75 md:scale-100">
          {/* Cube 1 */}
          <div className="absolute top-[259px] left-[90px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-300 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-300 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 2 */}
          <div className="absolute top-[172px] left-[225px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-400 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-400 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
          </div>
          
          {/* Cube 3 */}
          <div className="absolute top-[346px] left-[225px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-400 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-400 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-400 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 4 */}
          <div className="absolute top-[259px] left-[360px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-500 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-500 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-500 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 5 */}
          <div className="absolute top-[85px] left-[360px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-500 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-500 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 6 */}
          <div className="absolute top-[433px] left-[360px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-500 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-500 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 7 */}
          <div className="absolute top-[172px] left-[495px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-600 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-600 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-600 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 8 */}
          <div className="absolute top-[346px] left-[495px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-600 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-600 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-600 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 9 */}
          <div className="absolute top-[-1px] left-[495px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-600 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-600 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 10 */}
          <div className="absolute top-[520px] left-[495px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-600 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
          </div>
          
          {/* Cube 11 */}
          <div className="absolute top-[259px] left-[630px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-700 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-700 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-700 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 12 */}
          <div className="absolute top-[85px] left-[630px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-700 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-700 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-700 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 13 */}
          <div className="absolute top-[433px] left-[630px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-700 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-700 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-700 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 14 */}
          <div className="absolute top-[172px] left-[765px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-800 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 15 */}
          <div className="absolute top-[346px] left-[765px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-800 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 16 */}
          <div className="absolute top-[-1px] left-[765px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-800 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
          </div>
          
          {/* Cube 17 */}
          <div className="absolute top-[520px] left-[765px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 18 */}
          <div className="absolute top-[259px] left-[900px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-800 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 19 */}
          <div className="absolute top-[85px] left-[900px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-800 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 20 */}
          <div className="absolute top-[433px] left-[900px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 21 */}
          <div className="absolute top-[346px] left-[1035px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-800 transform rotate-[-30deg] skew-x-[-30deg] scale-y-[0.866]"></div>
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[-30deg] top-[39px] left-[45px]"></div>
          </div>
          
          {/* Cube 22 */}
          <div className="absolute top-[520px] left-[1035px] w-[90px] h-[90px]">
            <div className="absolute w-full h-full border border-gray-800 transform skew-y-[30deg] top-[39px] left-[-45px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IsometricBackground;

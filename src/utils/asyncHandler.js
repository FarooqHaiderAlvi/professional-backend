const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => next(err));
  };
};

export { asyncHandler };

//const asyncHandler=()=>{}
//const asyncHandler=(func)=>()=>{}
//const asyncHandler=async (func)=>()=>{}

/*
const asyncHandler = (fn) => async (req, res, next) => {
  try {
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
*/

const { createApp, reactive, computed, watch } = Vue;

const STORAGE_KEY = "lifecycle-model-demo-v6";

const createId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

function createDefaultFactor(type, category) {
  if (type === "output") {
    return {
      name: "waste treatment factor",
      value: 0.91,
      unit: "kg CO2-eq/kg",
      region: "CN",
      owner: "CPCD",
    };
  }

  const unitMap = {
    能源: "kg CO2-eq/kWh",
    运输: "kg CO2-eq/t*km",
    资源: "kg CO2-eq/t",
  };

  return {
    name: `${category || "原材料"}影响因子`,
    value: 1.23,
    unit: unitMap[category] || "kg CO2-eq/kg",
    region: "CN",
    owner: "CPCD",
  };
}

function createEmptyRoute() {
  return {
    id: createId("route"),
    name: "",
    weight: 0,
    from: "",
    to: "",
    distance: 0,
    mode: "公路运输",
    factor: {
      name: "transport, freight, lorry 16-32 metric ton",
      value: 0.168342,
      unit: "kg CO2-eq/t*km",
      region: "RoW",
      owner: "Ecoinvent",
    },
  };
}

function createItem({
  category,
  name,
  quantity,
  unit,
  source = "",
  note = "",
  certificateName = "",
  factor,
  transport,
  isReference = false,
  sourceProcessId = "",
  sourceProductId = "",
}) {
  return {
    id: createId("item"),
    category,
    name,
    quantity,
    unit,
    source,
    note,
    certificateName,
    factor: factor || createDefaultFactor("input", category),
    transport: transport || {
      required: false,
      routes: [],
    },
    isReference,
    sourceProcessId,
    sourceProductId,
  };
}

function createProcess({ name, outputName, quantity, unit, note = "", inputs = [], outputs = [] }) {
  const primaryProduct = {
    id: createId("product"),
    name: outputName || "",
    ratio: 100,
    quantity: quantity || 0,
    unit: unit || "kg",
    isMain: true,
  };

  return {
    id: createId("process"),
    name,
    outputName,
    quantity,
    unit,
    note,
    inputs,
    outputs,
    products: [primaryProduct],
    referenceInput: {
      enabled: false,
      sourceProcessId: "",
      sourceProductId: "",
    },
  };
}

const DEFAULT_MODEL = {
  product: {
    name: "涤纶纱线",
    model: "PF-2026",
    functionalUnit: "1 Piece(s)",
    quantity: 1,
    unit: "kg",
  },
  stages: [
    {
      id: "raw",
      name: "原料获取",
      processes: [
        createProcess({
          name: "原料预处理",
          outputName: "预处理切片",
          quantity: 1,
          unit: "kg",
          note: "含筛分和干燥",
          inputs: [
            createItem({
              category: "原材料",
              name: "再生 PET 切片",
              quantity: 1.02,
              unit: "kg",
              source: "采购台账",
              factor: {
                name: "聚对苯二甲酸乙二醇酯（rPET）",
                value: 2.31,
                unit: "kg CO2-eq/kg",
                region: "CN",
                owner: "CPCD",
              },
              transport: {
                required: true,
                routes: [
                  {
                    id: createId("route"),
                    name: "PET 切片运输",
                    weight: 1.02,
                    from: "苏州",
                    to: "无锡",
                    distance: 186,
                    mode: "公路运输",
                    factor: {
                      name: "transport, freight, lorry 16-32 metric ton",
                      value: 0.168342,
                      unit: "kg CO2-eq/t*km",
                      region: "RoW",
                      owner: "Ecoinvent",
                    },
                  },
                ],
              },
            }),
            createItem({
              category: "运输",
              name: "公路运输",
              quantity: 186,
              unit: "km",
              source: "物流系统",
              factor: {
                name: "transport, freight, lorry 16-32 metric ton",
                value: 0.168342,
                unit: "kg CO2-eq/t*km",
                region: "RoW",
                owner: "Ecoinvent",
              },
            }),
          ],
          outputs: [
            createItem({
              category: "固废",
              name: "筛杂固废",
              quantity: 0.01,
              unit: "kg",
              source: "人工估算",
              factor: {
                name: "waste treatment, municipal incineration",
                value: 0.91,
                unit: "kg CO2-eq/kg",
                region: "CN",
                owner: "CPCD",
              },
            }),
          ],
        }),
      ],
    },
    {
      id: "production",
      name: "生产",
      processes: [
        createProcess({
          name: "纺丝阶段",
          outputName: "纱线半成品",
          quantity: 109.06,
          unit: "kg",
          note: "主工序，可继续拆分卷绕、加捻等子工序",
          inputs: [
            createItem({
              category: "能源",
              name: "电网电力",
              quantity: 96.272,
              unit: "kWh",
              source: "电表抄表",
              factor: {
                name: "market for electricity, medium voltage",
                value: 0.578,
                unit: "kg CO2-eq/kWh",
                region: "CN",
                owner: "CPCD",
              },
            }),
            createItem({
              category: "资源",
              name: "自来水",
              quantity: 0.113,
              unit: "t",
              source: "水表抄表",
              factor: {
                name: "tap water production",
                value: 0.42,
                unit: "kg CO2-eq/t",
                region: "CN",
                owner: "CPCD",
              },
            }),
          ],
          outputs: [
            createItem({
              category: "废水",
              name: "废水 COD",
              quantity: 0.112,
              unit: "m3",
              source: "污水监测",
              factor: {
                name: "wastewater treatment, COD",
                value: 0.72,
                unit: "kg CO2-eq/m3",
                region: "CN",
                owner: "CPCD",
              },
            }),
          ],
        }),
        createProcess({
          name: "后整理阶段",
          outputName: "成品纱线",
          quantity: 108.4,
          unit: "kg",
          note: "示例中用第二道工序表达串行生产",
          inputs: [
            createItem({
              category: "能源",
              name: "柴油",
              quantity: 2.116,
              unit: "kg",
              source: "能源台账",
              factor: {
                name: "diesel combustion",
                value: 3.2,
                unit: "kg CO2-eq/kg",
                region: "CN",
                owner: "CPCD",
              },
            }),
          ],
          outputs: [
            createItem({
              category: "废水",
              name: "废水 BOD",
              quantity: 0.112,
              unit: "m3",
              source: "污水监测",
              factor: {
                name: "wastewater treatment, BOD",
                value: 0.63,
                unit: "kg CO2-eq/m3",
                region: "CN",
                owner: "CPCD",
              },
            }),
            createItem({
              category: "固废",
              name: "固体废物",
              quantity: 0.279,
              unit: "kg",
              source: "危废台账",
              factor: {
                name: "solid waste disposal",
                value: 0.91,
                unit: "kg CO2-eq/kg",
                region: "CN",
                owner: "CPCD",
              },
            }),
          ],
        }),
      ],
    },
    {
      id: "packaging",
      name: "包装",
      processes: [
        createProcess({
          name: "包装工序",
          outputName: "包装成品",
          quantity: 108.55,
          unit: "kg",
          inputs: [
            createItem({
              category: "包装",
              name: "纸箱",
              quantity: 0.12,
              unit: "kg",
              source: "BOM",
              factor: {
                name: "corrugated board box",
                value: 1.12,
                unit: "kg CO2-eq/kg",
                region: "CN",
                owner: "CPCD",
              },
            }),
            createItem({
              category: "包装",
              name: "缠绕膜",
              quantity: 0.03,
              unit: "kg",
              source: "BOM",
              factor: {
                name: "plastic film",
                value: 2.04,
                unit: "kg CO2-eq/kg",
                region: "CN",
                owner: "CPCD",
              },
            }),
          ],
          outputs: [],
        }),
      ],
    },
    {
      id: "distribution",
      name: "分销",
      processes: [
        createProcess({
          name: "运输至客户仓",
          outputName: "已交付产品",
          quantity: 108.55,
          unit: "kg",
          note: "可继续增加仓储、装卸等工序",
          inputs: [
            createItem({
              category: "运输",
              name: "柴油货车运输",
              quantity: 580,
              unit: "km",
              source: "物流系统",
              factor: {
                name: "transport, freight, lorry 16-32 metric ton",
                value: 0.168342,
                unit: "kg CO2-eq/t*km",
                region: "RoW",
                owner: "Ecoinvent",
              },
              transport: {
                required: true,
                routes: [
                  {
                    id: createId("route"),
                    name: "成品发运",
                    weight: 108.55,
                    from: "无锡",
                    to: "南京",
                    distance: 580,
                    mode: "公路运输",
                    factor: {
                      name: "transport, freight, lorry 16-32 metric ton",
                      value: 0.168342,
                      unit: "kg CO2-eq/t*km",
                      region: "RoW",
                      owner: "Ecoinvent",
                    },
                  },
                ],
              },
            }),
          ],
          outputs: [],
        }),
      ],
    },
    {
      id: "use",
      name: "使用",
      processes: [
        createProcess({
          name: "产品使用阶段",
          outputName: "使用后的产品",
          quantity: 1,
          unit: "piece",
          inputs: [
            createItem({
              category: "能源",
              name: "客户端用电",
              quantity: 8.4,
              unit: "kWh",
              source: "场景估算",
              factor: {
                name: "use phase electricity",
                value: 0.578,
                unit: "kg CO2-eq/kWh",
                region: "CN",
                owner: "CPCD",
              },
            }),
          ],
          outputs: [],
        }),
      ],
    },
    {
      id: "end",
      name: "废弃处理",
      processes: [
        createProcess({
          name: "回收与处置",
          outputName: "处置完成",
          quantity: 1,
          unit: "piece",
          inputs: [
            createItem({
              category: "运输",
              name: "回收运输",
              quantity: 65,
              unit: "km",
              source: "场景估算",
              factor: {
                name: "transport, freight, lorry 16-32 metric ton",
                value: 0.168342,
                unit: "kg CO2-eq/t*km",
                region: "RoW",
                owner: "Ecoinvent",
              },
              transport: {
                required: true,
                routes: [
                  {
                    id: createId("route"),
                    name: "回收运输",
                    weight: 1,
                    from: "南京",
                    to: "苏州",
                    distance: 65,
                    mode: "公路运输",
                    factor: {
                      name: "transport, freight, lorry 16-32 metric ton",
                      value: 0.168342,
                      unit: "kg CO2-eq/t*km",
                      region: "RoW",
                      owner: "Ecoinvent",
                    },
                  },
                ],
              },
            }),
          ],
          outputs: [
            createItem({
              category: "副产物",
              name: "回收料",
              quantity: 0.18,
              unit: "kg",
              source: "回收商数据",
              factor: {
                name: "recycled material credit",
                value: -0.42,
                unit: "kg CO2-eq/kg",
                region: "CN",
                owner: "自定义",
              },
            }),
          ],
        }),
      ],
    },
  ],
};

const productionStage = DEFAULT_MODEL.stages.find((stage) => stage.id === "production");
if (productionStage && productionStage.processes.length >= 2) {
  const sourceProcess = productionStage.processes[0];
  const targetProcess = productionStage.processes[1];
  targetProcess.referenceInput = {
    enabled: true,
    sourceProcessId: sourceProcess.id,
    sourceProductId: sourceProcess.products[0]?.id || "",
  };
}

const createEditorState = () => ({
  visible: false,
  mode: "create",
  type: "input",
  title: "",
  stageId: "",
  stageName: "",
  processId: "",
  processName: "",
  targetId: "",
  currentTab: "basic",
  form: {
    category: "原材料",
    name: "",
    quantity: 0,
    unit: "kg",
    source: "",
    note: "",
    outputName: "",
    certificateName: "",
    factor: createDefaultFactor("input", "原材料"),
    transport: {
      required: false,
      routes: [],
    },
  },
});

function loadModel() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return clone(DEFAULT_MODEL);
    }
    const parsed = JSON.parse(raw);
    const isValid =
      parsed &&
      Array.isArray(parsed.stages) &&
      parsed.stages.every(
        (stage) =>
          Array.isArray(stage.processes) &&
          stage.processes.every(
            (process) => Array.isArray(process.inputs) && Array.isArray(process.outputs)
          )
      );

    if (!isValid) {
      return clone(DEFAULT_MODEL);
    }

    parsed.stages.forEach((stage) => {
      stage.processes.forEach((process) => {
        if (!Array.isArray(process.products) || !process.products.length) {
          process.products = [
            {
              id: createId("product"),
              name: process.outputName || "",
              ratio: 100,
              quantity: Number(process.quantity || 0),
              unit: process.unit || "kg",
              isMain: true,
            },
          ];
        }

        if (!process.referenceInput) {
          process.referenceInput = {
            enabled: false,
            sourceProcessId: "",
            sourceProductId: "",
          };
        }
      });
    });

    return parsed;
  } catch (error) {
    return clone(DEFAULT_MODEL);
  }
}

createApp({
  setup() {
    const model = reactive(loadModel());
    const editor = reactive(createEditorState());

    const stageCount = computed(() => model.stages.length);

    const totalNodeCount = computed(() =>
      model.stages.reduce((sum, stage) => {
        return (
          sum +
          stage.processes.reduce((stageSum, process) => {
            return stageSum + 1 + (process.inputs?.length || 0) + (process.outputs?.length || 0);
          }, 0)
        );
      }, 0)
    );

    const totalOutputQuantity = computed(() =>
      model.stages.reduce((sum, stage) => {
        return (
          sum +
          stage.processes.reduce((processSum, process) => processSum + Number(process.quantity || 0), 0)
        );
      }, 0)
    );

    const isItemEditor = computed(() => editor.type !== "process");

    const currentRoute = computed(() => editor.form.transport?.routes?.[0] || null);

    const availableReferenceProcesses = computed(() => {
      if (editor.type !== "process") {
        return [];
      }

      const currentStage = findStage(editor.stageId);
      if (!currentStage) {
        return [];
      }

      return currentStage.processes.filter((process) => process.id !== editor.processId);
    });

    const availableReferenceProducts = computed(() => {
      if (editor.type !== "process") {
        return [];
      }

      const sourceProcess = findProcess(editor.stageId, editor.form.referenceInput.sourceProcessId);
      return sourceProcess?.products || [];
    });

    watch(
      model,
      (value) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      },
      { deep: true }
    );

    function formatNumber(value) {
      const number = Number(value || 0);
      if (Number.isNaN(number)) {
        return "0";
      }
      return Number.isInteger(number) ? `${number}` : number.toFixed(3).replace(/\.?0+$/, "");
    }

    function findStage(stageId) {
      return model.stages.find((stage) => stage.id === stageId) || null;
    }

    function findProcess(stageId, processId) {
      const stage = findStage(stageId);
      if (!stage) {
        return null;
      }
      return stage.processes.find((process) => process.id === processId) || null;
    }

    function findCollection(stageId, type, processId = "") {
      const stage = findStage(stageId);
      if (!stage) {
        return [];
      }
      if (type === "process") {
        return stage.processes;
      }
      const process = findProcess(stageId, processId);
      if (!process) {
        return [];
      }
      return type === "input" ? process.inputs : process.outputs;
    }

    function getStageProcessLabel(stageId, processId) {
      const process = findProcess(stageId, processId);
      return process ? process.name : "";
    }

    function getProcessIndex(stage, processId) {
      return stage.processes.findIndex((process) => process.id === processId);
    }

    function getPrimaryProduct(process) {
      return process.products?.find((product) => product.isMain) || process.products?.[0] || null;
    }

    function getDisplayInputs(stageId, process) {
      const displayInputs = (process.inputs || []).map((item) => {
        if (!item.isReference) {
          return item;
        }

        const sourceProcess = findProcess(stageId, item.sourceProcessId);
        const sourceProduct =
          sourceProcess?.products?.find((product) => product.id === item.sourceProductId) ||
          sourceProcess?.products?.[0];

        if (!sourceProcess || !sourceProduct) {
          return item;
        }

        return {
          ...item,
          name: sourceProduct.name || item.name || "未命名产物",
          quantity: Number(sourceProduct.quantity || item.quantity || 0),
          unit: sourceProduct.unit || item.unit || model.product.unit,
          source: sourceProcess.name,
          sourceProcessName: sourceProcess.name,
          sourceProductName: sourceProduct.name || item.name || "未命名产物",
        };
      });

      const hasReferenceItem = displayInputs.some((item) => item.isReference);
      if (!hasReferenceItem && process.referenceInput?.enabled) {
        const fallbackReference = buildReferenceInputRecord(stageId, process.referenceInput);
        if (fallbackReference) {
          const sourceProcess = findProcess(stageId, fallbackReference.sourceProcessId);
          const sourceProduct =
            sourceProcess?.products?.find(
              (product) => product.id === fallbackReference.sourceProductId
            ) || sourceProcess?.products?.[0];

          displayInputs.unshift({
            ...fallbackReference,
            sourceProcessName: sourceProcess?.name || "",
            sourceProductName: sourceProduct?.name || fallbackReference.name,
          });
        }
      }

      return displayInputs;
    }

    function getReferenceSourceProcessName(referenceInput) {
      if (!referenceInput?.sourceProcessId) {
        return "";
      }
      return findProcess(editor.stageId, referenceInput.sourceProcessId)?.name || "";
    }

    function getReferenceSourceProductName(referenceInput) {
      if (!referenceInput?.sourceProcessId || !referenceInput?.sourceProductId) {
        return "";
      }
      const process = findProcess(editor.stageId, referenceInput.sourceProcessId);
      return (
        process?.products?.find((product) => product.id === referenceInput.sourceProductId)?.name || ""
      );
    }

    function resetEditorForm(type) {
      editor.form.category = type === "output" ? "废气" : "原材料";
      editor.form.name = "";
      editor.form.quantity = 0;
      editor.form.unit = type === "process" ? model.product.unit : "kg";
      editor.form.source = "";
      editor.form.note = "";
      editor.form.outputName = "";
      editor.form.certificateName = "";
      editor.form.factor = createDefaultFactor(type, editor.form.category);
      editor.form.transport = {
        required: false,
        routes: [],
      };
      editor.form.products = [
        {
          id: createId("product"),
          name: "",
          ratio: 100,
          quantity: 0,
          unit: model.product.unit,
          isMain: true,
        },
      ];
      editor.form.referenceInput = {
        enabled: false,
        sourceProcessId: "",
        sourceProductId: "",
      };
      editor.currentTab = "basic";
    }

    function openCreateEditor(stageId, type, processId = "") {
      const stage = findStage(stageId);
      const process = processId ? findProcess(stageId, processId) : null;
      resetEditorForm(type);
      editor.visible = true;
      editor.mode = "create";
      editor.type = type;
      editor.stageId = stageId;
      editor.stageName = stage?.name || "";
      editor.processId = processId;
      editor.processName = process?.name || "";
      editor.targetId = "";
      editor.title =
        type === "process"
          ? `新增工序 - ${editor.stageName}`
          : `新增${type === "input" ? "输入" : "输出"} - ${editor.processName || editor.stageName}`;
    }

    function openEditEditor(stageId, type, targetId, processId = "") {
      const stage = findStage(stageId);
      const process = processId ? findProcess(stageId, processId) : null;
      const collection = findCollection(stageId, type, processId);
      const target = collection.find((item) => item.id === targetId);
      if (!stage || !target) {
        return;
      }

      editor.visible = true;
      editor.mode = "edit";
      editor.type = type;
      editor.stageId = stageId;
      editor.stageName = stage.name;
      editor.processId = processId;
      editor.processName = process?.name || "";
      editor.targetId = targetId;
      editor.currentTab = "basic";
      editor.title =
        type === "process"
          ? `编辑工序 - ${stage.name}`
          : `编辑${type === "input" ? "输入" : "输出"} - ${editor.processName || stage.name}`;

      editor.form.category = target.category || (type === "output" ? "废气" : "原材料");
      editor.form.name = target.name || "";
      editor.form.quantity = target.quantity || 0;
      editor.form.unit = target.unit || "kg";
      editor.form.source = target.source || "";
      editor.form.note = target.note || "";
      editor.form.outputName = target.outputName || "";
      editor.form.certificateName = target.certificateName || "";
      editor.form.factor = clone(target.factor || createDefaultFactor(type, target.category));
      editor.form.transport = clone(
        target.transport || {
          required: false,
          routes: [],
        }
      );
      editor.form.products = clone(
        target.products || [
          {
            id: createId("product"),
            name: target.outputName || "",
            ratio: 100,
            quantity: Number(target.quantity || 0),
            unit: target.unit || model.product.unit,
            isMain: true,
          },
        ]
      );
      editor.form.referenceInput = clone(
        target.referenceInput || {
          enabled: false,
          sourceProcessId: "",
          sourceProductId: "",
        }
      );
    }

    function closeEditor() {
      Object.assign(editor, createEditorState());
    }

    function setEditorTab(tab) {
      editor.currentTab = tab;
    }

    function addProcessProduct(isMain = false) {
      if (!Array.isArray(editor.form.products)) {
        editor.form.products = [];
      }

      if (isMain) {
        editor.form.products.forEach((product) => {
          product.isMain = false;
          product.ratio = Number(product.ratio || 0);
        });
      }

      editor.form.products.push({
        id: createId("product"),
        name: "",
        ratio: isMain ? 100 : 0,
        quantity: 0,
        unit: model.product.unit,
        isMain,
      });
    }

    function removeProcessProduct(productId) {
      if (!Array.isArray(editor.form.products)) {
        return;
      }

      const index = editor.form.products.findIndex((product) => product.id === productId);
      if (index === -1) {
        return;
      }

      editor.form.products.splice(index, 1);

      if (!editor.form.products.some((product) => product.isMain) && editor.form.products[0]) {
        editor.form.products[0].isMain = true;
        if (!Number(editor.form.products[0].ratio)) {
          editor.form.products[0].ratio = 100;
        }
      }
    }

    function setMainProduct(productId) {
      editor.form.products.forEach((product) => {
        product.isMain = product.id === productId;
        if (product.isMain && !Number(product.ratio)) {
          product.ratio = 100;
        }
      });
    }

    function setReferenceInputEnabled(enabled) {
      editor.form.referenceInput.enabled = enabled;
      if (!enabled) {
        editor.form.referenceInput.sourceProcessId = "";
        editor.form.referenceInput.sourceProductId = "";
      }
    }

    function handleReferenceProcessChange() {
      const firstProduct = availableReferenceProducts.value[0];
      editor.form.referenceInput.sourceProductId = firstProduct ? firstProduct.id : "";
    }

    function buildReferenceInputRecord(stageId, referenceInput, existingId = "") {
      if (!referenceInput?.enabled || !referenceInput.sourceProcessId || !referenceInput.sourceProductId) {
        return null;
      }

      const sourceProcess = findProcess(stageId, referenceInput.sourceProcessId);
      const sourceProduct =
        sourceProcess?.products?.find((product) => product.id === referenceInput.sourceProductId) ||
        sourceProcess?.products?.[0];

      if (!sourceProcess || !sourceProduct) {
        return null;
      }

      return createItem({
        category: "其他工序产物",
        name: sourceProduct.name || "未命名产物",
        quantity: Number(sourceProduct.quantity || 0),
        unit: sourceProduct.unit || model.product.unit,
        source: sourceProcess.name,
        note: "",
        factor: createDefaultFactor("input", "其他工序产物"),
        transport: {
          required: false,
          routes: [],
        },
        isReference: true,
        sourceProcessId: sourceProcess.id,
        sourceProductId: sourceProduct.id,
        certificateName: "",
      });
    }

    function setTransportRequired(required) {
      editor.form.transport.required = required;
      if (required && editor.form.transport.routes.length === 0) {
        editor.form.transport.routes.push(createEmptyRoute());
      }
      if (!required) {
        editor.form.transport.routes = [];
      }
    }

    function ensureFirstRoute() {
      if (!editor.form.transport.routes.length) {
        editor.form.transport.routes.push(createEmptyRoute());
      }
      return editor.form.transport.routes[0];
    }

    function applyMockFactor(scope) {
      if (scope === "transport") {
        const route = ensureFirstRoute();
        route.factor = {
          name: "transport, freight, lorry 16-32 metric ton",
          value: 0.168342,
          unit: "kg CO2-eq/t*km",
          region: "RoW",
          owner: "Ecoinvent",
        };
        return;
      }
      editor.form.factor = createDefaultFactor(editor.type, editor.form.category);
    }

    function saveEditor() {
      const stage = findStage(editor.stageId);
      const collection = findCollection(editor.stageId, editor.type, editor.processId);
      if (!stage || !collection) {
        return;
      }

      const commonPayload = {
        name: editor.form.name.trim(),
        quantity: Number(editor.form.quantity || 0),
        unit: editor.form.unit.trim(),
        note: editor.form.note.trim(),
      };

      if (!commonPayload.name || !commonPayload.unit) {
        window.alert("请先填写完整名称和单位。");
        return;
      }

      if (editor.type === "process" && !editor.form.outputName.trim()) {
        // Legacy field, ignored by process editor.
      }

      let payload;
      if (editor.type === "process") {
        if (!Array.isArray(editor.form.products) || editor.form.products.length === 0) {
          window.alert("请至少添加一个产出物。");
          return;
        }

        const previous = editor.mode === "edit" ? findProcess(editor.stageId, editor.targetId) : null;
        const normalizedProducts = (editor.form.products || []).map((product, index) => ({
          id: product.id || createId("product"),
          name: (product.name || "").trim(),
          ratio: Number(product.ratio || 0),
          quantity: Number(product.quantity || 0),
          unit: (product.unit || model.product.unit).trim(),
          isMain: product.isMain || index === 0,
        }));
        const mainProduct =
          normalizedProducts.find((product) => product.isMain) || normalizedProducts[0] || null;

        if (!mainProduct || !mainProduct.name || !mainProduct.unit) {
          window.alert("请完善主产出物的名称和单位。");
          return;
        }

        const previousInputs = clone(previous?.inputs || []).filter((item) => !item.isReference);
        const existingReference = clone(previous?.inputs || []).find((item) => item.isReference);
        const referenceRecord = buildReferenceInputRecord(
          editor.stageId,
          editor.form.referenceInput,
          existingReference?.id || ""
        );
        if (referenceRecord) {
          previousInputs.unshift(referenceRecord);
        }

        payload = {
          id: editor.targetId || createId("process"),
          ...commonPayload,
          outputName: mainProduct?.name || editor.form.outputName.trim(),
          quantity: mainProduct?.quantity ?? Number(editor.form.quantity || 0),
          unit: mainProduct?.unit || editor.form.unit.trim(),
          inputs: previousInputs,
          outputs: clone(previous?.outputs || []),
          products: normalizedProducts,
          referenceInput: clone(editor.form.referenceInput),
        };
      } else {
        payload = {
          id: editor.targetId || createId(editor.type),
          ...commonPayload,
          category: editor.form.category,
          source: editor.form.source.trim(),
          certificateName: editor.form.certificateName.trim(),
          factor: clone(editor.form.factor),
          transport: clone(editor.form.transport),
        };
      }

      if (editor.mode === "edit") {
        const targetIndex = collection.findIndex((item) => item.id === editor.targetId);
        if (targetIndex !== -1) {
          collection[targetIndex] = payload;
        }
      } else {
        collection.push(payload);
      }

      closeEditor();
    }

    function removeEditorItem() {
      const collection = findCollection(editor.stageId, editor.type, editor.processId);
      const targetIndex = collection.findIndex((item) => item.id === editor.targetId);
      if (targetIndex === -1) {
        return;
      }

      const confirmed = window.confirm("确定删除当前节点吗？");
      if (!confirmed) {
        return;
      }

      collection.splice(targetIndex, 1);
      closeEditor();
    }

    function resetModel() {
      const confirmed = window.confirm("确定恢复到示例数据吗？当前修改会被覆盖。");
      if (!confirmed) {
        return;
      }

      const fresh = clone(DEFAULT_MODEL);
      model.product = fresh.product;
      model.stages.splice(0, model.stages.length, ...fresh.stages);
      closeEditor();
    }

    async function copyModelJson() {
      const json = JSON.stringify(model, null, 2);
      try {
        await navigator.clipboard.writeText(json);
        window.alert("模型 JSON 已复制到剪贴板。");
      } catch (error) {
        window.prompt("当前环境不支持自动复制，请手动复制下面内容：", json);
      }
    }

    function autoOpenFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const openType = params.get("open");
      if (!openType || !["input", "output", "process"].includes(openType)) {
        return;
      }

      const stage = findStage(params.get("stage")) || model.stages[0];
      if (!stage) {
        return;
      }

      const processIndex = Number(params.get("process") || 0);
      const process = stage.processes[processIndex] || stage.processes[0];
      const collection =
        openType === "process"
          ? stage.processes
          : findCollection(stage.id, openType, process?.id || "");
      const index = Number(params.get("index") || 0);
      const target = collection[index] || collection[0];

      if (target) {
        openEditEditor(stage.id, openType, target.id, process?.id || "");
      } else {
        openCreateEditor(stage.id, openType, process?.id || "");
      }

      const tab = params.get("tab");
      if (tab === "basic" || tab === "transport") {
        editor.currentTab = tab;
      }
    }

    autoOpenFromQuery();

    return {
      model,
      editor,
      stageCount,
      totalNodeCount,
      totalOutputQuantity,
      isItemEditor,
      currentRoute,
      availableReferenceProcesses,
      availableReferenceProducts,
      formatNumber,
      getStageProcessLabel,
      getProcessIndex,
      getPrimaryProduct,
      getDisplayInputs,
      getReferenceSourceProcessName,
      getReferenceSourceProductName,
      openCreateEditor,
      openEditEditor,
      closeEditor,
      setEditorTab,
      addProcessProduct,
      removeProcessProduct,
      setMainProduct,
      setReferenceInputEnabled,
      handleReferenceProcessChange,
      setTransportRequired,
      applyMockFactor,
      saveEditor,
      removeEditorItem,
      resetModel,
      copyModelJson,
    };
  },
}).mount("#app");
